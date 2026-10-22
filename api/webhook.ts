// Vercel function: https://<your-app>.vercel.app/api/webhook
// GET  = Meta's one-time webhook verification
// POST = incoming WhatsApp messages
import { waitUntil } from "@vercel/functions";
import { config, missingConfig } from "../src/config.js";
import { handleMessage } from "../src/handler.js";
import { parseWebhook, verifySignature } from "../src/whatsapp.js";

export function GET(request: Request): Response {
  const params = new URL(request.url).searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    config.verifyToken &&
    params.get("hub.verify_token") === config.verifyToken
  ) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request): Promise<Response> {
  const missing = missingConfig();
  if (missing.length) {
    console.error(`[webhook] missing env: ${missing.join(", ")}`);
    return new Response("Server not configured", { status: 500 });
  }

  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Acknowledge right away (Meta retries slow webhooks) and reply in the background.
  const work = Promise.all(
    parseWebhook(body).map((msg) =>
      handleMessage(msg).catch((err) => console.error(`[webhook] message ${msg.id} failed`, err)),
    ),
  );
  waitUntil(work);
  return new Response("OK", { status: 200 });
}

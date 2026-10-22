// Thin client for the WhatsApp Cloud API (Meta Graph API).
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

export interface IncomingMessage {
  id: string;
  from: string; // customer's number, digits only
  name?: string; // WhatsApp profile name
  type: string;
  text?: string; // set for text, button and list replies
}

/** Pull the customer messages out of a webhook payload (ignores status updates). */
export function parseWebhook(body: any): IncomingMessage[] {
  const out: IncomingMessage[] = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value;
      if (!value?.messages) continue;
      const names = new Map<string, string>(
        (value.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]),
      );
      for (const m of value.messages) {
        out.push({
          id: m.id,
          from: m.from,
          name: names.get(m.from),
          type: m.type,
          text:
            m.text?.body ??
            m.button?.text ??
            m.interactive?.button_reply?.title ??
            m.interactive?.list_reply?.title ??
            m.image?.caption ??
            undefined,
        });
      }
    }
  }
  return out;
}

/** Verify Meta's X-Hub-Signature-256 header. Skipped when no app secret is set. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  if (!config.appSecret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", config.appSecret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  return (
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"))
  );
}

async function graph(payload: object): Promise<void> {
  const url = `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  }
}

const MAX_TEXT = 4096;

export async function sendText(to: string, text: string): Promise<void> {
  // WhatsApp caps a text message at 4096 characters.
  for (let i = 0; i < text.length; i += MAX_TEXT) {
    await graph({ to, type: "text", text: { body: text.slice(i, i + MAX_TEXT) } });
  }
}

/** Show blue ticks and a "typing…" indicator while the agent thinks. */
export async function markReadWithTyping(messageId: string): Promise<void> {
  await graph({
    status: "read",
    message_id: messageId,
    typing_indicator: { type: "text" },
  });
}

// Local server for testing the webhook: `npm run dev`, then expose it with
// a tunnel (e.g. `npx cloudflared tunnel --url http://localhost:3000`) and set
// https://<tunnel>/api/webhook as the callback URL in the Meta dashboard.
import { createServer } from "node:http";
import { GET, POST } from "../api/webhook.js";

const port = Number(process.env.PORT ?? 3000);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  if (url.pathname !== "/api/webhook") {
    res.writeHead(404).end("Not found");
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
  });
  const response = req.method === "POST" ? await POST(request) : GET(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(port, () => console.log(`Webhook listening on http://localhost:${port}/api/webhook`));

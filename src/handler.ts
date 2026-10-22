// What happens to each incoming WhatsApp message.
import { formatUserTurn, runAgent, type AgentContext } from "./agent.js";
import { config } from "./config.js";
import { store } from "./store.js";
import { markReadWithTyping, sendText, type IncomingMessage } from "./whatsapp.js";

const UNSUPPORTED_REPLY =
  "Maaf, saya hanya boleh membaca mesej teks buat masa ini. Boleh taip soalan anda? 🙏\n" +
  "Sorry, I can only read text messages for now. Could you type your question?";

// Message types we silently ignore.
const IGNORED_TYPES = new Set(["reaction", "sticker", "system", "unsupported", "ephemeral"]);

async function notifyOwner(text: string): Promise<void> {
  if (!config.ownerNumber) {
    console.log(`[owner alert] ${text}`);
    return;
  }
  // Note: free-form messages only reach the owner if they messaged this
  // number in the last 24 hours (WhatsApp rule). See README.
  await sendText(config.ownerNumber, text);
}

function chatLink(customer: string): string {
  return `https://wa.me/${customer}`;
}

function agentContext(msg: IncomingMessage): AgentContext {
  const who = `${msg.name ?? "Customer"} (+${msg.from})`;
  return {
    customer: msg.from,
    customerName: msg.name,
    async recordEnquiry(d) {
      await store.saveLead({ customer: msg.from, createdAt: new Date().toISOString(), ...d });
      await notifyOwner(
        [
          `🧾 *New enquiry* from ${who}`,
          `• Name: ${d.customer_name || "-"}`,
          `• Product: ${d.product || "-"}`,
          `• Quantity: ${d.quantity || "-"}`,
          `• Event date: ${d.event_date || "-"}`,
          `• Event type: ${d.event_type || "-"}`,
          `• Delivery area: ${d.delivery_area || "-"}`,
          `• Notes: ${d.notes || "-"}`,
          `Chat: ${chatLink(msg.from)}`,
        ].join("\n"),
      );
    },
    async handoff(reason, summary) {
      await store.setPaused(msg.from, config.handoffHours);
      await notifyOwner(
        `🙋 *Customer needs a person*: ${who}\n` +
          `Reason: ${reason}\n${summary}\n` +
          `Chat: ${chatLink(msg.from)}\n` +
          `Bot paused ${config.handoffHours}h for this chat. Send "/resume ${msg.from}" to turn it back on.`,
      );
    },
  };
}

/** Commands the owner can send to the bot number. */
async function ownerCommand(text: string): Promise<string> {
  const [cmd, arg = ""] = text.trim().split(/\s+/, 2);
  const number = arg.replace(/\D/g, "");
  switch (cmd.toLowerCase()) {
    case "/pause":
      if (!number) return "Usage: /pause 60123456789";
      await store.setPaused(number, config.handoffHours);
      return `Bot paused for +${number} for ${config.handoffHours}h.`;
    case "/resume":
      if (!number) return "Usage: /resume 60123456789";
      await store.clearPaused(number);
      return `Bot is back on for +${number}.`;
    case "/reset":
      if (!number) return "Usage: /reset 60123456789";
      await store.clearHistory(number);
      await store.clearPaused(number);
      return `Conversation memory cleared for +${number}.`;
    default:
      return "Commands: /pause <number>, /resume <number>, /reset <number>";
  }
}

export async function handleMessage(msg: IncomingMessage): Promise<void> {
  if (!(await store.markSeen(msg.id))) return; // WhatsApp retried a delivery
  if (IGNORED_TYPES.has(msg.type)) return;

  if (msg.from === config.ownerNumber && msg.text?.trim().startsWith("/")) {
    await sendText(msg.from, await ownerCommand(msg.text));
    return;
  }

  if (!msg.text) {
    await sendText(msg.from, UNSUPPORTED_REPLY);
    return;
  }

  const userTurn = { role: "user" as const, text: formatUserTurn(msg.text, msg.name) };

  if (await store.isPaused(msg.from)) {
    // A human is handling this chat; keep the message for context only.
    await store.appendHistory(msg.from, [userTurn], config.historyLimit);
    return;
  }

  markReadWithTyping(msg.id).catch((err) => console.warn("[wa] typing indicator failed", err.message));

  const history = [...(await store.getHistory(msg.from)), userTurn];
  const { reply, ok } = await runAgent(history, agentContext(msg));
  if (!ok) {
    // The AI couldn't answer (e.g. free daily quota used up): make sure a human sees it.
    await notifyOwner(
      `⚠️ *Bot couldn't answer* ${msg.name ?? "a customer"} (+${msg.from}). Please reply yourself:\n` +
        `"${msg.text}"\nChat: ${chatLink(msg.from)}`,
    ).catch((err) => console.error("[owner alert] failed", err));
  }

  await sendText(msg.from, reply);
  await store.appendHistory(
    msg.from,
    [userTurn, { role: "assistant", text: reply }],
    config.historyLimit,
  );
}

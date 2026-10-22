// Linked-device mode: the bot logs in to your existing WhatsApp (Business) app
// number as a linked device, like WhatsApp Web, so the bot and your staff share
// one number. UNOFFICIAL: this is against WhatsApp's terms and the number can be
// banned. It is a stopgap until coexistence through the official API is set up.
//
// Behaviour:
// - Replies only to people who message you first, in private chats.
// - Waits a few seconds and shows "typing…" before replying, and limits how many
//   replies it sends per minute, to look less like a bot.
// - When anyone replies from the phone app, the bot goes quiet in that chat.
// - Alerts (new enquiries, handoffs) go to your own "Message yourself" chat, or
//   to ALERT_WHATSAPP_NUMBER if set. Send /pause, /resume, /reset there.
import {
  Browsers,
  DisconnectReason,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isJidStatusBroadcast,
  isPnUser,
  jidNormalizedUser,
  makeWASocket,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { formatUserTurn, runAgent, type AgentContext } from "./agent.js";
import { config } from "./config.js";
import { ownerCommand } from "./handler.js";
import { store } from "./store.js";

const AUTH_DIR = process.env.LINKED_AUTH_DIR || "./auth_linked";
const ALERT_NUMBER = (process.env.ALERT_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const PAIR_NUMBER = (process.env.LINK_WITH_CODE || "").replace(/\D/g, "");
const MAX_REPLIES_PER_MINUTE = Number(process.env.MAX_REPLIES_PER_MINUTE || "15");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const digits = (jid: string) => jid.split("@")[0].split(":")[0].replace(/\D/g, "");

/** IDs of messages the bot sent, so they aren't mistaken for staff replies. */
const botSent = new Set<string>();
const replyTimes: number[] = [];
const startedAt = Math.floor(Date.now() / 1000);

export function messageText(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    undefined
  ) ?? undefined;
}

/** True for messages the bot should never react to. */
function ignoredChat(jid: string | null | undefined): boolean {
  return (
    !jid ||
    !!isJidGroup(jid) ||
    !!isJidBroadcast(jid) ||
    isJidStatusBroadcast(jid) ||
    !!isJidNewsletter(jid)
  );
}

/** Stable key for a customer: phone digits when known, else the raw JID. */
function customerKey(msg: WAMessage): { key: string; phone?: string } {
  const jid = msg.key.remoteJid!;
  const alt = msg.key.remoteJidAlt;
  const pnJid = isPnUser(jid) ? jid : alt && isPnUser(alt) ? alt : undefined;
  const phone = pnJid ? digits(pnJid) : undefined;
  return { key: phone ?? jid, phone };
}

async function underRateLimit(): Promise<boolean> {
  const now = Date.now();
  while (replyTimes.length && now - replyTimes[0] > 60_000) replyTimes.shift();
  if (replyTimes.length >= MAX_REPLIES_PER_MINUTE) return false;
  replyTimes.push(now);
  return true;
}

async function send(sock: WASocket, jid: string, text: string) {
  const sent = await sock.sendMessage(jid, { text });
  if (sent?.key.id) botSent.add(sent.key.id);
}

/** Show "typing…" for a human-ish time, then send. */
async function sendLikeHuman(sock: WASocket, jid: string, text: string) {
  await sleep(rand(1500, 3500));
  await sock.sendPresenceUpdate("composing", jid).catch(() => {});
  await sleep(Math.min(8000, 1500 + text.length * 25));
  await sock.sendPresenceUpdate("paused", jid).catch(() => {});
  await send(sock, jid, text);
}

function alertJid(sock: WASocket): string {
  if (ALERT_NUMBER) return `${ALERT_NUMBER}@s.whatsapp.net`;
  return jidNormalizedUser(sock.user!.id); // your own "Message yourself" chat
}

function agentContext(sock: WASocket, msg: WAMessage, key: string, phone?: string): AgentContext {
  const name = msg.pushName || "Customer";
  const who = phone ? `${name} (+${phone})` : name;
  const link = phone ? `https://wa.me/${phone}` : "(open the chat in WhatsApp)";
  return {
    customer: key,
    customerName: msg.pushName ?? undefined,
    async recordEnquiry(d) {
      await store.saveLead({ customer: key, createdAt: new Date().toISOString(), ...d });
      await send(
        sock,
        alertJid(sock),
        [
          `🧾 *New enquiry* from ${who}`,
          `• Name: ${d.customer_name || "-"}`,
          `• Product: ${d.product || "-"}`,
          `• Quantity: ${d.quantity || "-"}`,
          `• Event date: ${d.event_date || "-"}`,
          `• Event type: ${d.event_type || "-"}`,
          `• Delivery area: ${d.delivery_area || "-"}`,
          `• Notes: ${d.notes || "-"}`,
          `Chat: ${link}`,
        ].join("\n"),
      );
    },
    async handoff(reason, summary) {
      await store.setPaused(key, config.handoffHours);
      await send(
        sock,
        alertJid(sock),
        `🙋 *Customer needs a person*: ${who}\nReason: ${reason}\n${summary}\n` +
          `👉 Reply to them in this WhatsApp: ${link}\n` +
          `The bot stays quiet in that chat for ${config.handoffHours}h.`,
      );
    },
  };
}

async function handle(sock: WASocket, msg: WAMessage) {
  const jid = msg.key.remoteJid;
  if (ignoredChat(jid) || !msg.message || !msg.key.id) return;
  if (msg.message.protocolMessage || msg.message.reactionMessage) return;
  if (Number(msg.messageTimestamp ?? 0) < startedAt - 30) return; // old/history
  if (!(await store.markSeen(msg.key.id))) return;

  const ownJid = jidNormalizedUser(sock.user!.id);
  const ownLid = sock.user?.lid ? jidNormalizedUser(sock.user.lid) : "";
  const isSelfChat = jid === ownJid || jid === ownLid;
  const text = messageText(msg)?.trim();

  if (msg.key.fromMe) {
    if (botSent.has(msg.key.id)) return; // the bot's own reply
    if (isSelfChat) {
      if (text?.startsWith("/")) await send(sock, ownJid, await ownerCommand(text));
      return;
    }
    // A person replied from the phone app: step back in this chat.
    const { key } = customerKey(msg);
    await store.setPaused(key, config.handoffHours);
    console.log(`[linked] staff replied to ${key}; bot paused ${config.handoffHours}h`);
    return;
  }
  if (isSelfChat) return;

  const { key, phone } = customerKey(msg);
  if (!text) return; // stickers, voice notes, photos without caption: leave for staff

  const userTurn = { role: "user" as const, text: formatUserTurn(text, msg.pushName ?? undefined) };
  if (await store.isPaused(key)) {
    await store.appendHistory(key, [userTurn], config.historyLimit);
    return;
  }
  if (!(await underRateLimit())) {
    console.warn(`[linked] rate limit reached; leaving ${key} for staff`);
    return;
  }

  await sock.readMessages([msg.key]).catch(() => {});
  const history = [...(await store.getHistory(key)), userTurn];
  const { reply, ok } = await runAgent(history, agentContext(sock, msg, key, phone));
  if (!ok) {
    // Stay silent to the customer; staff see the message in the app anyway.
    await send(sock, alertJid(sock), `⚠️ Bot couldn't answer ${msg.pushName ?? key}: "${text}"`);
    return;
  }
  await sendLikeHuman(sock, jid!, reply);
  await store.appendHistory(key, [userTurn, { role: "assistant", text: reply }], config.historyLimit);
}

export async function startLinkedBot(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.windows("Desktop"),
    markOnlineOnConnect: false, // keep phone notifications working
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;
  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      if (PAIR_NUMBER && !pairingRequested) {
        pairingRequested = true;
        const code = await sock.requestPairingCode(PAIR_NUMBER);
        console.log(`\nOn your phone: WhatsApp > Linked devices > Link a device > Link with phone number instead\nEnter this code: ${code}\n`);
      } else if (!PAIR_NUMBER) {
        console.log("\nOn your phone: WhatsApp > Linked devices > Link a device, then scan:\n");
        qrcode.generate(qr, { small: true });
      }
    }
    if (connection === "open") {
      console.log(`[linked] connected as ${sock.user?.id}. Bot is running.`);
    }
    if (connection === "close") {
      const status = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.error(`[linked] logged out. Delete ${AUTH_DIR} and run again to re-link.`);
        process.exit(1);
      }
      console.warn(`[linked] connection closed (${status}); reconnecting in 5s`);
      setTimeout(() => startLinkedBot().catch(console.error), 5000);
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      handle(sock, msg).catch((err) => console.error("[linked] message failed", err));
    }
  });
}

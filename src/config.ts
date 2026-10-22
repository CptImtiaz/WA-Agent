// All settings come from environment variables. See .env.example.

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  // Google Gemini (free API key: https://aistudio.google.com/apikey)
  geminiApiKey: optional("GEMINI_API_KEY"),
  // "gemini-flash-latest" always points at Google's current Flash model,
  // which is included in the free tier. Set a fixed ID to pin a version.
  model: optional("GEMINI_MODEL", "gemini-flash-latest"),
  // Used when the main model is busy or over its free limit. Set to "" to disable.
  backupModel: process.env.GEMINI_BACKUP_MODEL?.trim() ?? "gemini-flash-lite-latest",

  // WhatsApp Cloud API (Meta)
  whatsappToken: optional("WHATSAPP_TOKEN"),
  phoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  verifyToken: optional("WHATSAPP_VERIFY_TOKEN"),
  appSecret: optional("WHATSAPP_APP_SECRET"),
  graphVersion: optional("WHATSAPP_GRAPH_VERSION", "v23.0"),

  // Owner / staff number that receives order leads and handoff alerts,
  // digits only with country code, e.g. 60123456789.
  ownerNumber: optional("OWNER_WHATSAPP_NUMBER").replace(/\D/g, ""),

  // Number your staff use to contact customers after a handoff. The bot tells
  // the customer to expect a message or call from it. Defaults to the owner number.
  staffContactNumber: optional("STAFF_CONTACT_NUMBER", optional("OWNER_WHATSAPP_NUMBER")).replace(/\D/g, ""),

  // "linked" when running as a linked device on your WhatsApp app number
  // (scripts/linked-device.ts); staff then reply in the same chat.
  linkedMode: process.env.BOT_MODE === "linked",

  // How long the bot stays quiet after handing a chat to a human.
  handoffHours: Number(optional("HANDOFF_HOURS", "12")),

  // Number of past messages (user + assistant) kept per customer.
  historyLimit: Number(optional("HISTORY_LIMIT", "30")),
};

export function missingConfig(): string[] {
  const required: [string, string][] = [
    ["GEMINI_API_KEY", config.geminiApiKey],
    ["WHATSAPP_TOKEN", config.whatsappToken],
    ["WHATSAPP_PHONE_NUMBER_ID", config.phoneNumberId],
    ["WHATSAPP_VERIFY_TOKEN", config.verifyToken],
  ];
  return required.filter(([, v]) => !v).map(([k]) => k);
}

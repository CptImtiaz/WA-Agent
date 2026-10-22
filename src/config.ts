// All settings come from environment variables. See .env.example.

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const config = {
  // Claude
  model: optional("CLAUDE_MODEL", "claude-opus-5-5"),
  effort: optional("CLAUDE_EFFORT", "low") as "low" | "medium" | "high",

  // WhatsApp Cloud API (Meta)
  whatsappToken: optional("WHATSAPP_TOKEN"),
  phoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  verifyToken: optional("WHATSAPP_VERIFY_TOKEN"),
  appSecret: optional("WHATSAPP_APP_SECRET"),
  graphVersion: optional("WHATSAPP_GRAPH_VERSION", "v23.0"),

  // Owner / staff number that receives order leads and handoff alerts,
  // digits only with country code, e.g. 60123456789.
  ownerNumber: optional("OWNER_WHATSAPP_NUMBER").replace(/\D/g, ""),

  // How long the bot stays quiet after handing a chat to a human.
  handoffHours: Number(optional("HANDOFF_HOURS", "12")),

  // Number of past messages (user + assistant) kept per customer.
  historyLimit: Number(optional("HISTORY_LIMIT", "30")),
};

export function missingWhatsAppConfig(): string[] {
  const required: [string, string][] = [
    ["WHATSAPP_TOKEN", config.whatsappToken],
    ["WHATSAPP_PHONE_NUMBER_ID", config.phoneNumberId],
    ["WHATSAPP_VERIFY_TOKEN", config.verifyToken],
  ];
  return required.filter(([, v]) => !v).map(([k]) => k);
}

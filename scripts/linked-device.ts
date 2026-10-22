// Run the bot as a linked device on your existing WhatsApp (Business) app number.
//   npm run linked                      -> shows a QR code to scan
//   LINK_WITH_CODE=60123456789 npm run linked -> shows an 8-letter pairing code
// UNOFFICIAL and against WhatsApp's terms: the number can be banned. See README.
process.env.BOT_MODE = "linked";
const { startLinkedBot } = await import("../src/linked.js");
await startLinkedBot();

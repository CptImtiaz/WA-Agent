// Talk to the assistant in your terminal, no WhatsApp needed: `npm run chat`
// Needs only GEMINI_API_KEY. Owner alerts are printed instead of sent.
import { createInterface } from "node:readline/promises";
import { formatUserTurn, runAgent } from "../src/agent.js";
import type { ChatTurn } from "../src/store.js";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const history: ChatTurn[] = [];

console.log("Chat with Sultana Assistant. Type /quit to exit.\n");
while (true) {
  const text = (await rl.question("You: ")).trim();
  if (!text) continue;
  if (text === "/quit") break;
  const userTurn: ChatTurn = { role: "user", text: formatUserTurn(text, "Test Customer") };
  history.push(userTurn);
  const { reply, sendCampaignImages } = await runAgent(history, {
    customer: "60000000000",
    customerName: "Test Customer",
    canSendImages: true,
    async recordEnquiry(d) {
      console.log("\n[owner alert] New enquiry:", d, "\n");
    },
    async handoff(reason, summary) {
      console.log(`\n[owner alert] Handoff (${reason}): ${summary}\n`);
    },
  });
  history.push({ role: "assistant", text: reply });
  console.log(`\nSultana: ${reply}\n`);
  if (sendCampaignImages) console.log("[sends the 3 campaign posters]\n");
}
rl.close();

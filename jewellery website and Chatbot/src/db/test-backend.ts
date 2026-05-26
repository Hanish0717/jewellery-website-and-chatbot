import * as dotenv from "dotenv";
dotenv.config();

import { runChatbot } from "./chatService";

async function testChatbot() {
  console.log("=========================================");
  console.log("        CHATBOT SERVICE TEST             ");
  console.log("=========================================\n");

  const message = "Show bridal sets under 2 lakh";
  console.log(`Sending message: "${message}"`);
  console.log("History: [] (empty)\n");

  try {
    const start = Date.now();
    const result = await runChatbot(message, []);
    const duration = Date.now() - start;
    console.log(`✅ SUCCESS: runChatbot responded in ${duration}ms!`);
    console.log("Result object:", JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("❌ ERROR: runChatbot failed!");
    console.error("Stack trace:", err.stack || err);
  }
  console.log("\n=========================================");
}

testChatbot().catch(console.error);

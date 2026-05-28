import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./src/db/db";
import { priceDropAlerts, leads, automatedMessages } from "./src/db/schema";

async function main() {
  console.log("--- LEADS ---");
  const allLeads = await db.select().from(leads).limit(10);
  console.log(JSON.stringify(allLeads, null, 2));

  console.log("--- PRICE ALERTS ---");
  const allAlerts = await db.select().from(priceDropAlerts).limit(10);
  console.log(JSON.stringify(allAlerts, null, 2));

  console.log("--- AUTOMATED MESSAGES ---");
  const allMsgs = await db.select().from(automatedMessages).limit(10);
  console.log(JSON.stringify(allMsgs, null, 2));
  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

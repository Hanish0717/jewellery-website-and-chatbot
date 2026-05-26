import { createServerFn } from "@tanstack/react-start";
import { runChatbot, saveLead } from "./chatService";
import { db } from "./db";
import { products } from "./schema";

// Server function for getting all products
export const getProductsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const results = await db.select({
        id: products.id,
        name: products.name,
        price: products.price,
        priceVal: products.priceVal,
        category: products.category,
        description: products.description,
        imageUrl: products.imageUrl,
      }).from(products);
      return results;
    } catch (error) {
      console.warn("Could not fetch products from database. Using fallback.", error);
      return [];
    }
  });

// Server function for sending chat message
export const chatFn = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string; history: { role: "user" | "ai"; text: string }[] }) => data)
  .handler(async ({ data }) => {
    try {
      console.log("[chatFn] Input data:", JSON.stringify(data));
      console.log("[chatFn] DATABASE_URL defined:", !!process.env.DATABASE_URL);
      console.log("[chatFn] GROQ_API_KEY defined:", !!process.env.GROQ_API_KEY);
      const result = await runChatbot(data.message, data.history);
      console.log("[chatFn] Result success");
      return result;
    } catch (error: any) {
      console.error("[chatFn] Error in chatFn server handler:", error);
      if (error && error.stack) {
        console.error("[chatFn] Stack trace:", error.stack);
      }
      throw new Error(`Failed to process chat message: ${error.message || error}`);
    }
  });

// Server function for submitting a captured lead
export const submitLeadFn = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; phone: string }) => data)
  .handler(async ({ data }) => {
    try {
      const result = await saveLead(data.name, data.phone);
      return { success: true, lead: result[0] };
    } catch (error) {
      console.error("Error in submitLeadFn server handler:", error);
      throw new Error("Failed to save lead");
    }
  });

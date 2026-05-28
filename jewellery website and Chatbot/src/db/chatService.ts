import { db } from "./db";
import { products, faqs, leads } from "./schema";
import { sql, or, and, lte } from "drizzle-orm";
import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
let groq: Groq | null = null;

if (apiKey && apiKey !== "your_groq_api_key_here") {
  groq = new Groq({ apiKey });
} else {
  console.log("No GROQ_API_KEY found or placeholder detected in chatService.ts.");
}

// Fetch embeddings using Google's gemini-embedding-2 model (output dimension configured to 768)
export async function getEmbedding(text: string): Promise<number[] | null> {
  let geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    geminiKey = geminiKey.trim();
  }
  if (!geminiKey || geminiKey === "your_gemini_api_key_here") {
    return null;
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text }] },
        outputDimensionality: 768
      })
    });
    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`Google Embeddings API status ${response.status}: ${errBody}`);
    }
    const data = await response.json();
    return data.embedding.values;
  } catch (err) {
    console.warn("[getEmbedding] Failed to fetch semantic embedding:", err);
    return null;
  }
}


// Product search with smart keyword parsing and budget limits
export async function searchProducts(queryText: string) {
  const query = queryText.toLowerCase();
  
  // 1. Detect budget limit (e.g. "under 2 lakh", "below 1.5 lakhs", "under 50,000")
  let budgetLimit: number | null = null;
  const lakhMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lacs|l)/i);
  
  if (lakhMatch) {
    budgetLimit = parseFloat(lakhMatch[1]) * 100000;
  } else {
    // Match raw numbers after under/below (e.g. "under 50000" or "under 50,000")
    const rawNumberMatch = query.match(/(?:under|below|less than)\s*(?:rs\.?|₹)?\s*(\d+(?:,\d+)*)/i);
    if (rawNumberMatch) {
      budgetLimit = parseInt(rawNumberMatch[1].replace(/,/g, ""));
    }
  }

  // 2. Detect category keyword
  let categoryFilter: string | null = null;
  const categories = ["bridal", "ring", "necklace", "earring", "bangle", "mangalsutra", "pendant", "bracelet"];
  for (const cat of categories) {
    if (query.includes(cat)) {
      categoryFilter = cat;
      break;
    }
  }

  // 3. Try Semantic Vector search first (RAG)
  const queryEmbedding = await getEmbedding(queryText);
  if (queryEmbedding) {
    try {
      const embeddingString = `[${queryEmbedding.join(",")}]`;
      let conditions = [];

      if (budgetLimit !== null) {
        conditions.push(lte(products.priceVal, budgetLimit));
      }
      if (categoryFilter) {
        conditions.push(sql`${products.category} ILIKE ${`%${categoryFilter}%`}`);
      }

      let qBuilder = db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          priceVal: products.priceVal,
          category: products.category,
          description: products.description,
          imageUrl: products.imageUrl,
          similarity: sql<number>`${products.embedding} <=> ${embeddingString}::vector`
        })
        .from(products);

      if (conditions.length > 0) {
        qBuilder = qBuilder.where(and(...conditions)) as typeof qBuilder;
      }

      const matchingProducts = await qBuilder
        .orderBy(sql`${products.embedding} <=> ${embeddingString}::vector`)
        .limit(4);

      if (matchingProducts.length > 0) {
        console.log(`[searchProducts] Semantic vector search returned ${matchingProducts.length} results.`);
        return matchingProducts;
      }
    } catch (vectorErr) {
      console.warn("[searchProducts] Vector query failed, falling back to SQL keyword search:", vectorErr);
    }
  }

  // 4. Fallback to SQL keyword search
  try {
    let conditions = [];

    // Filter by price if budget was parsed
    if (budgetLimit !== null) {
      conditions.push(lte(products.priceVal, budgetLimit));
    }

    // Filter by category if category keyword detected
    if (categoryFilter) {
      conditions.push(sql`${products.category} ILIKE ${`%${categoryFilter}%`}`);
    }

    // Keyword matching on name/description if there are search terms
    const stopWords = ["the", "a", "of", "and", "do", "you", "have", "for", "in", "under", "lakh", "lakhs", "rupees", "rs", "show", "me", "find"];
    const keywords = query
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word));

    if (keywords.length > 0 && !categoryFilter) {
      const keywordConditions = keywords.map(
        (word) => or(
          sql`${products.name} ILIKE ${`%${word}%`}`,
          sql`${products.description} ILIKE ${`%${word}%`}`
        )
      );
      conditions.push(and(...keywordConditions));
    }

    // Execute query
    let matchingProducts = [];
    if (conditions.length > 0) {
      matchingProducts = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          priceVal: products.priceVal,
          category: products.category,
          description: products.description,
          imageUrl: products.imageUrl,
        })
        .from(products)
        .where(and(...conditions))
        .limit(4);
    }

    // If query returned nothing, fall back to broad search on keywords
    if (matchingProducts.length === 0 && keywords.length > 0) {
      const fallbackConditions = keywords.map(
        (word) => or(
          sql`${products.name} ILIKE ${`%${word}%`}`,
          sql`${products.description} ILIKE ${`%${word}%`}`,
          sql`${products.category} ILIKE ${`%${word}%`}`
        )
      );
      matchingProducts = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          priceVal: products.priceVal,
          category: products.category,
          description: products.description,
          imageUrl: products.imageUrl,
        })
        .from(products)
        .where(or(...fallbackConditions))
        .limit(4);
    }

    // Default fallback if still empty: return signature items
    if (matchingProducts.length === 0) {
      matchingProducts = await db
        .select({
          id: products.id,
          name: products.name,
          price: products.price,
          priceVal: products.priceVal,
          category: products.category,
          description: products.description,
          imageUrl: products.imageUrl,
        })
        .from(products)
        .limit(4);
    }

    return matchingProducts;
  } catch (error) {
    console.error("Database search error, using empty results:", error);
    return [];
  }
}


// FAQ search matching keywords in PostgreSQL
export async function searchFAQs(queryText: string) {
  const query = queryText.toLowerCase();
  
  // Try Semantic Vector search first (RAG)
  const queryEmbedding = await getEmbedding(queryText);
  if (queryEmbedding) {
    try {
      const embeddingString = `[${queryEmbedding.join(",")}]`;
      const matchingFAQs = await db
        .select({
          id: faqs.id,
          question: faqs.question,
          answer: faqs.answer,
          category: faqs.category,
        })
        .from(faqs)
        .orderBy(sql`${faqs.embedding} <=> ${embeddingString}::vector`)
        .limit(3);

      if (matchingFAQs.length > 0) {
        console.log(`[searchFAQs] Semantic vector search returned ${matchingFAQs.length} FAQs.`);
        return matchingFAQs;
      }
    } catch (vectorErr) {
      console.warn("[searchFAQs] Vector FAQ query failed, falling back to keyword search:", vectorErr);
    }
  }

  // Extract keywords
  const stopWords = ["the", "a", "of", "and", "do", "you", "have", "for", "in", "what", "is", "are", "about", "your"];
  const keywords = query
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  try {
    let conditions = [];
    if (keywords.length > 0) {
      conditions = keywords.map(
        (word) => or(
          sql`${faqs.question} ILIKE ${`%${word}%`}`,
          sql`${faqs.answer} ILIKE ${`%${word}%`}`,
          sql`${faqs.category} ILIKE ${`%${word}%`}`
        )
      );
    }

    let matchingFAQs = [];
    if (conditions.length > 0) {
      matchingFAQs = await db
        .select({
          id: faqs.id,
          question: faqs.question,
          answer: faqs.answer,
          category: faqs.category,
        })
        .from(faqs)
        .where(or(...conditions))
        .limit(3);
    }

    // If still empty, load general information
    if (matchingFAQs.length === 0) {
      matchingFAQs = await db
        .select({
          id: faqs.id,
          question: faqs.question,
          answer: faqs.answer,
          category: faqs.category,
        })
        .from(faqs)
        .limit(3);
    }

    return matchingFAQs;
  } catch (error) {
    console.error("Database FAQ search error, using empty results:", error);
    return [];
  }
}


// Orchestrate the Groq Llama RAG Chatbot
export async function runChatbot(
  message: string,
  history: { role: "user" | "ai"; text: string }[]
): Promise<{ text: string; triggerLeadCapture: boolean }> {
  
  // 1. Fetch relevant context from database
  const matchedProducts = await searchProducts(message);
  const matchedFAQs = await searchFAQs(message);

  // 2. Format context for LLM prompt
  const productContext = matchedProducts
    .map(
      (p) =>
        `- Name: ${p.name}\n  Price: ${p.price} (${p.priceVal} INR)\n  Category: ${p.category}\n  Description: ${p.description}`
    )
    .join("\n\n");

  const faqContext = matchedFAQs
    .map((f) => `- Q: ${f.question}\n  A: ${f.answer}`)
    .join("\n\n");

  // 3. Generate prompt instruction set
  const systemPrompt = `You are Anaya, the premium and elegant personal jewellery consultant at Aurum Vault (flagship atelier at Plot 14, Road 36, Jubilee Hills, Hyderabad). 
Your tone must be warm, sophisticated, professional, and sales-focused. You are speaking to high-net-worth clients looking for luxury gold, diamonds, polki, and bridal jewellery.

Use the following catalog and FAQs to answer the user's questions:

### RELEVANT PRODUCTS FROM CATALOGUE:
${productContext || "No specific products matched. Mention general signature pieces or ask about their preference."}

### RELEVANT STORE FAQS:
${faqContext || "No specific FAQs matched. Answer using general boutique info."}

### DIRECTIVES:
1. Always suggest real products from the context above (include names and prices).
2. If the customer asks for a "bridal set under 2 lakh", make sure to highlight the "Divine Temple Choker" (₹ 1,95,000) or "Royal Polki Choker" (₹ 2,72,500).
3. If they ask about gold necklaces under 1 lakh, highlight "Empress Chandelier Drops" (₹ 92,800) or "Aureate Gold Chain" (₹ 85,000) or "Aurelia Diamond Pendant" (₹ 48,500).
4. Do NOT make up products not in the catalogue. If nothing fits, suggest booking a bespoke customization consultation.
5. Keep answers concise, elegant, and persuasive.
6. **Lead Capture Rule**: If the user shows buying intent (e.g. asking to purchase, book an appointment, schedule a viewing, or requesting to contact the showroom), you must politely ask to collect their details (Name and Phone) to arrange this, and append the exact string "[TRIGGER_LEAD_FORM]" at the very end of your response.`;

  // 4. Run LLM call using Groq (Llama-3.3-70b-versatile)
  if (groq) {
    try {
      // Map history to standard OpenAI/Groq format
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt }
      ];

      // Add previous messages (max 6 to keep context window compact & latency ultra-low)
      const recentHistory = history.slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text
        });
      }

      // Add current message
      messages.push({ role: "user", content: message });

      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        max_tokens: 500,
      });

      const rawText = chatCompletion.choices[0]?.message?.content || "";

      // Check for Lead Form trigger
      const triggerLeadCapture = rawText.includes("[TRIGGER_LEAD_FORM]");
      const cleanText = rawText.replace("[TRIGGER_LEAD_FORM]", "").trim();

      return {
        text: cleanText,
        triggerLeadCapture,
      };
    } catch (e) {
      console.error("Groq API request failed, falling back to local simulation:", e);
    }
  }

  // 5. Offline Fallback (If Groq client fails or is missing an API Key)
  return runLocalFallback(message, matchedProducts, matchedFAQs);
}

// Local simulation fallback
function runLocalFallback(
  message: string,
  matchedProducts: any[],
  matchedFAQs: any[]
): { text: string; triggerLeadCapture: boolean } {
  const query = message.toLowerCase();
  
  // Detect intent
  const buyingIntent =
    query.includes("buy") ||
    query.includes("book") ||
    query.includes("appointment") ||
    query.includes("schedule") ||
    query.includes("visit") ||
    query.includes("purchase");

  let reply = "Namaste. I am Anaya. ";

  if (matchedProducts.length > 0) {
    reply += `We have some beautiful options for you. For instance, the **${matchedProducts[0].name}** (${matchedProducts[0].price}) which is a ${matchedProducts[0].category.toLowerCase()} piece: ${matchedProducts[0].description} `;
    if (matchedProducts.length > 1) {
      reply += `You might also love the **${matchedProducts[1].name}** priced at ${matchedProducts[1].price}. `;
    }
  } else if (matchedFAQs.length > 0) {
    reply += `${matchedFAQs[0].answer} `;
  } else {
    reply += "I would be delighted to help you find the perfect piece at our Jubilee Hills atelier. We offer gold chains, rings, bracelets, and bridal chokers. Would you like to schedule a private viewing?";
  }

  if (buyingIntent) {
    reply += "\n\nI would love to set up a priority appointment for you. Please share your Name and Phone Number so our boutique manager can confirm your slot.";
  }

  return {
    text: reply,
    triggerLeadCapture: buyingIntent,
  };
}

// Save lead
export async function saveLead(name: string, phone: string, email?: string, telegram?: string) {
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const { sql } = await import("drizzle-orm");
    const [existing] = await db
      .select()
      .from(leads)
      .where(sql`LOWER(${leads.email}) = ${cleanEmail}`)
      .limit(1);

    if (existing) {
      // Update existing lead details to ensure unique emails in leads table
      return await db
        .update(leads)
        .set({
          name: name.trim(),
          phone: phone.trim(),
          telegram: telegram ? telegram.trim() : existing.telegram,
          createdAt: new Date(), // Push to top of list
        })
        .where(sql`LOWER(${leads.email}) = ${cleanEmail}`)
        .returning();
    }
  }

  // Insert new lead
  return await db.insert(leads).values({
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : null,
    telegram: telegram ? telegram.trim() : null,
  }).returning();
}

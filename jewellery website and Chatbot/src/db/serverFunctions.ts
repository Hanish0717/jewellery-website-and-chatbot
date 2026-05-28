import { createServerFn } from "@tanstack/react-start";
import { runChatbot, saveLead } from "./chatService";
import { db } from "./db";
// nodemailer will be loaded dynamically if Gmail credentials are present
import { products } from "./schema";

// Server function for getting all products
export const getProductsFn = createServerFn({ method: "POST" })
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
        offerText: products.offerText,
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
  .inputValidator((data: { name: string; phone: string; email?: string; telegram?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const result = await saveLead(data.name, data.phone, data.email, data.telegram);

      // Trigger Webhook CRM/Sheets integration if configured
      let webhookUrl = process.env.LEAD_WEBHOOK_URL;
      if (webhookUrl) {
        webhookUrl = webhookUrl.trim();
      }
      if (webhookUrl && webhookUrl !== "your_webhook_url_here") {
        try {
          console.log("[submitLeadFn] Pushing lead to webhook:", webhookUrl);
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event: "lead.captured",
              name: data.name,
              phone: data.phone,
              email: data.email,
              telegram: data.telegram,
              source: "Aurum Vault AI Chatbot",
              timestamp: new Date().toISOString(),
            }),
          });
          if (!response.ok) {
            console.warn(`[submitLeadFn] Webhook returned status ${response.status}`);
          } else {
            console.log("[submitLeadFn] Lead successfully pushed to webhook/CRM.");
          }
        } catch (webhookErr) {
          console.warn("[submitLeadFn] Webhook push failed:", webhookErr);
        }
      }

      return { success: true, lead: result[0] };
    } catch (error) {
      console.error("Error in submitLeadFn server handler:", error);
      throw new Error("Failed to save lead");
    }
  });


// Server function for registering a price drop alert subscription
export const subscribePriceAlertFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      name: string;
      phone: string;
      email?: string;
      telegram?: string;
      deliveryChannel?: string;
      productId?: number;
      productName?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const { priceDropAlerts, products } = await import("./schema");
      const { eq } = await import("drizzle-orm");

      let resolvedProductId: number | null = null;

      // 1. Try to find by name if productName is provided
      if (data.productName) {
        const [dbProd] = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.name, data.productName))
          .limit(1);
        if (dbProd) {
          resolvedProductId = dbProd.id;
        }
      }

      // 2. If not resolved, try to check if the provided productId exists
      if (!resolvedProductId && data.productId) {
        const [dbProd] = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, data.productId))
          .limit(1);
        if (dbProd) {
          resolvedProductId = dbProd.id;
        }
      }

      // 3. Fallback: get the very first product from the database
      if (!resolvedProductId) {
        const [firstProd] = await db
          .select({ id: products.id })
          .from(products)
          .limit(1);
        if (firstProd) {
          resolvedProductId = firstProd.id;
          console.log(`[subscribePriceAlertFn] Product not found by name/ID. Defaulted to first database product ID: ${resolvedProductId}`);
        }
      }

      // 4. Ultimate fallback if DB has no products
      if (!resolvedProductId) {
        resolvedProductId = 1;
        console.warn("[subscribePriceAlertFn] No products found in database. Using default ID 1.");
      }

      const result = await db.insert(priceDropAlerts).values({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        telegram: data.telegram || null,
        deliveryChannel: data.deliveryChannel || "whatsapp",
        productId: resolvedProductId,
        active: true,
      }).returning();
      return { success: true, alert: result[0] };
    } catch (error) {
      console.error("Error in subscribePriceAlertFn server handler:", error);
      throw new Error("Failed to subscribe to price alerts");
    }
  });

// Server function to fetch all price drop alert subscriptions
export const getPriceAlertsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { priceDropAlerts, products } = await import("./schema");
      const { eq } = await import("drizzle-orm");
      const results = await db
        .select({
          id: priceDropAlerts.id,
          name: priceDropAlerts.name,
          phone: priceDropAlerts.phone,
          email: priceDropAlerts.email,
          telegram: priceDropAlerts.telegram,
          productId: priceDropAlerts.productId,
          productName: products.name,
          active: priceDropAlerts.active,
          deliveryChannel: priceDropAlerts.deliveryChannel,
          createdAt: priceDropAlerts.createdAt,
        })
        .from(priceDropAlerts)
        .innerJoin(products, eq(priceDropAlerts.productId, products.id));
      return results;
    } catch (error) {
      console.error("Error in getPriceAlertsFn server handler:", error);
      return [];
    }
  });

// Server function to fetch all leads (collected via chat)
export const getLeadsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { leads } = await import("./schema");
      const { desc } = await import("drizzle-orm");
      const results = await db.select().from(leads).orderBy(desc(leads.createdAt));
      return results;
    } catch (error) {
      console.error("Error in getLeadsFn server handler:", error);
      return [];
    }
  });

// Server function to fetch all sent automated notifications
export const getAutomatedMessagesFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { automatedMessages } = await import("./schema");
      const { desc } = await import("drizzle-orm");
      const results = await db
        .select()
        .from(automatedMessages)
        .orderBy(desc(automatedMessages.createdAt));
      return results;
    } catch (error) {
      console.error("Error in getAutomatedMessagesFn server handler:", error);
      return [];
    }
  });

// Helper to send actual WhatsApp notification via Twilio REST API
async function sendActualWhatsApp(toPhone: string, messageText: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken || accountSid.includes("your_twilio_sid_here")) {
    console.log("[WhatsApp REST API] Credentials not configured in .env. Skipping real WhatsApp dispatch.");
    return { success: false, mode: "simulated" };
  }

  try {
    // Format toPhone: clean input phone of any spaces/dashes/brackets
    let cleanedPhone = toPhone.replace(/\s+/g, "").replace(/[-()]/g, "");
    
    // Add default country code (+91 for India) if it starts with 10 digits
    if (/^[6-9]\d{9}$/.test(cleanedPhone)) {
      cleanedPhone = `+91${cleanedPhone}`;
    } else if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = `+${cleanedPhone}`;
    }

    const recipient = `whatsapp:${cleanedPhone}`;
    const sender = fromWhatsApp.startsWith("whatsapp:") ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: new URLSearchParams({
          From: sender,
          To: recipient,
          Body: messageText,
        }).toString(),
      }
    );

    const resJson = await response.json();
    if (response.ok) {
      console.log(`[WhatsApp REST API] Real WhatsApp alert successfully sent to ${recipient}! SID: ${resJson.sid}`);
      return { success: true, mode: "twilio", sid: resJson.sid };
    } else {
      console.error("[WhatsApp REST API] Twilio responded with an error:", resJson);
      return { success: false, mode: "error", error: resJson };
    }
  } catch (error) {
    console.error("[WhatsApp REST API] Network error during Twilio WhatsApp dispatch:", error);
    return { success: false, mode: "error", error };
  }
}

async function sendActualEmail(toEmail: string, subject: string, htmlBody: string) {
  const gmailUser = process.env.EMAIL_USER;
  const gmailPass = process.env.EMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    console.error("[Gmail Email API] Gmail credentials not set in .env.");
    return { success: false, mode: "missing_credentials" };
  }

  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
      // Force IPv4 resolution to avoid IPv6 connectivity issues
      // Node's net options can be set via `family` (4 = IPv4)
      // @ts-ignore – nodemailer passes extra options to the underlying socket
      family: 4,
    });

    await transporter.sendMail({
      from: `"Aurum Vault" <${gmailUser}>`,
      to: toEmail,
      subject,
      html: htmlBody,
    });

    console.log(`[Gmail Email API] Real Email alert successfully sent to ${toEmail}`);
    return { success: true, mode: "gmail" };
  } catch (error) {
    console.error("[Gmail Email API] Error sending email:", error);
    return { success: false, mode: "error", error };
  }
}

// Helper to send Telegram message via Telegram Bot API
async function sendActualTelegram(chatId: string, messageText: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || botToken.includes("your_telegram_bot_token_here")) {
    console.log("[Telegram Bot API] Token not configured in .env. Skipping real Telegram dispatch.");
    return { success: false, mode: "simulated" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: "HTML",
      }),
    });

    const resJson = await response.json();
    if (response.ok && resJson.ok) {
      console.log(`[Telegram Bot API] Real Telegram alert successfully sent to chat ${chatId}!`);
      return { success: true, mode: "telegram" };
    } else {
      console.error("[Telegram Bot API] Telegram responded with an error:", resJson);
      return { success: false, mode: "error", error: resJson };
    }
  } catch (error) {
    console.error("[Telegram Bot API] Network error during Telegram dispatch:", error);
    return { success: false, mode: "error", error };
  }
}

// Helper to generate a luxury dark gold HTML email template
function craftEmailHtml(
  name: string,
  messageText: string,
  type: "price_drop" | "offer",
  productName: string,
  oldPrice?: string | null,
  newPrice?: string | null
) {
  const isPriceDrop = type === "price_drop";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Aurum Vault Exclusive Alert</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0c0c0c;
          font-family: 'Playfair Display', 'Didot', 'Georgia', serif;
          color: #ffffff;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #121212;
          border: 1px solid #c5a880;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
        }
        .header {
          background: linear-gradient(135deg, #1f1a14 0%, #0d0d0d 100%);
          padding: 40px 20px;
          text-align: center;
          border-bottom: 1px solid #c5a880;
        }
        .logo {
          font-size: 26px;
          letter-spacing: 4px;
          color: #d4af37;
          text-transform: uppercase;
          margin: 0;
          font-weight: 300;
        }
        .subtitle {
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          font-size: 10px;
          letter-spacing: 2px;
          color: #c5a880;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .content {
          padding: 40px 30px;
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          line-height: 1.6;
          color: #e5e5e5;
        }
        .greeting {
          font-family: 'Playfair Display', 'Didot', 'Georgia', serif;
          font-size: 20px;
          color: #d4af37;
          margin-bottom: 20px;
        }
        .message-box {
          border-left: 3px solid #d4af37;
          padding-left: 20px;
          margin: 25px 0;
          font-style: italic;
          color: #c5a880;
        }
        .product-card {
          background-color: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 20px;
          margin: 30px 0;
          text-align: center;
        }
        .product-name {
          font-family: 'Playfair Display', 'Didot', 'Georgia', serif;
          font-size: 22px;
          color: #ffffff;
          margin-bottom: 15px;
        }
        .price-compare {
          display: inline-block;
          margin: 10px 0;
          font-size: 18px;
        }
        .old-price {
          text-decoration: line-through;
          color: #888888;
          margin-right: 15px;
        }
        .new-price {
          color: #d4af37;
          font-weight: bold;
          font-size: 22px;
        }
        .cta-btn {
          display: inline-block;
          background: linear-gradient(135deg, #c5a880 0%, #a3845b 100%);
          color: #0c0c0c !important;
          text-decoration: none;
          padding: 15px 35px;
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-radius: 4px;
          margin-top: 15px;
          box-shadow: 0 4px 10px rgba(197, 168, 128, 0.3);
        }
        .footer {
          background-color: #0d0d0d;
          padding: 30px;
          text-align: center;
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          font-size: 11px;
          color: #666666;
          border-top: 1px solid #1a1a1a;
          letter-spacing: 1px;
        }
        .footer a {
          color: #c5a880;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo">Aurum Vault</h1>
          <div class="subtitle">Luxury Atelier & Boutique</div>
        </div>
        <div class="content">
          <div class="greeting">Greetings, ${name}</div>
          <p>We are delighted to bring you an exclusive update regarding your selected piece from our vault.</p>
          
          <div class="product-card">
            <div class="product-name">${productName}</div>
            ${isPriceDrop && oldPrice && newPrice ? `
              <div class="price-compare">
                <span class="old-price">${oldPrice}</span>
                <span class="new-price">${newPrice}</span>
              </div>
            ` : ''}
            <div class="message-box">
              "${messageText}"
            </div>
            <a href="https://aurumvault.com/boutique" class="cta-btn">View Collection</a>
          </div>
          
          <p>Should you wish to reserve this piece or schedule a private virtual or in-person viewing, please contact our concierge service directly.</p>
        </div>
        <div class="footer">
          <p>AURUM VAULT ATELIER &bull; JUBILEE HILLS, HYDERABAD</p>
          <p>This is an exclusive automated invitation. For assistance, contact <a href="mailto:concierge@aurumvault.com">concierge@aurumvault.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Server function to trigger a price drop or offer update and notify subscribers
export const triggerPriceDropOrOfferFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      productId: number;
      newPrice?: string;
      newPriceVal?: number;
      offerText?: string;
      type: "price_drop" | "offer";
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const { products, priceDropAlerts, automatedMessages } = await import("./schema");
      const { eq, and } = await import("drizzle-orm");

      // 1. Get current product info
      const [product] = await db
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
        .where(eq(products.id, data.productId))
        .limit(1);
      if (!product) {
        throw new Error("Product not found");
      }

      const oldPrice = product.price;
      let newPrice = product.price;

      // 2. Update the product price or offer in db
      if (data.type === "price_drop" && data.newPrice && data.newPriceVal) {
        await db
          .update(products)
          .set({ price: data.newPrice, priceVal: data.newPriceVal, offerText: null })
          .where(eq(products.id, data.productId));
        newPrice = data.newPrice;
      } else if (data.type === "offer" && data.offerText) {
        await db
          .update(products)
          .set({ offerText: data.offerText })
          .where(eq(products.id, data.productId));
      }

      // 3. Find active alerts for this product
      const subscribers = await db
        .select()
        .from(priceDropAlerts)
        .where(
          and(eq(priceDropAlerts.productId, data.productId), eq(priceDropAlerts.active, true))
        );

      // 4. Create automated messages for each subscriber and dispatch across enabled channels
      const sentMessages = [];
      for (const sub of subscribers) {
        let msgContent = "";
        if (data.type === "price_drop") {
          msgContent = `✨ Aurum Vault Alert: Dear ${sub.name}, there is a price drop on your liked product "${product.name}"! The price has dropped from ${oldPrice} to ${newPrice}. Visit our Jubilee Hills showroom or book a viewing now.`;
        } else {
          msgContent = `✨ Aurum Vault Offer: Dear ${sub.name}, exclusive offer on your liked product "${product.name}"! ${data.offerText}. Visit us to claim this special offer.`;
        }

        const [newMsg] = await db
          .insert(automatedMessages)
          .values({
            alertId: sub.id,
            name: sub.name,
            phone: sub.phone,
            email: sub.email,
            telegram: sub.telegram,
            productName: product.name,
            oldPrice: data.type === "price_drop" ? oldPrice : null,
            newPrice: data.type === "price_drop" ? newPrice : null,
            message: msgContent,
            type: data.type,
          })
          .returning();

        // 5. Parse delivery channels and trigger API calls
        const channels = sub.deliveryChannel ? sub.deliveryChannel.toLowerCase().split(",") : ["whatsapp"];
        const hasWhatsApp = channels.includes("whatsapp") || channels.includes("all") || channels.length === 0;
        const hasEmail = (channels.includes("email") || channels.includes("all")) && sub.email;
        const hasTelegram = (channels.includes("telegram") || channels.includes("all")) && sub.telegram;

        if (hasWhatsApp) {
          try {
            await sendActualWhatsApp(sub.phone, msgContent);
          } catch (apiErr) {
            console.error(`[WhatsApp Dispatch] Error during live message dispatch to ${sub.phone}:`, apiErr);
          }
        }

        if (hasEmail && sub.email) {
          try {
            const subject = data.type === "price_drop"
              ? `✨ Exclusive Price Drop: ${product.name}`
              : `✨ Special Offer: ${product.name}`;
            const emailHtml = craftEmailHtml(sub.name, msgContent, data.type, product.name, oldPrice, newPrice);
            await sendActualEmail(sub.email, subject, emailHtml);
          } catch (apiErr) {
            console.error(`[Email Dispatch] Error during live email dispatch to ${sub.email}:`, apiErr);
          }
        }

        if (hasTelegram && sub.telegram) {
          try {
            const tgMsg = `<b>${data.type === 'price_drop' ? '✨ Price Drop Alert ✨' : '✨ Special Offer ✨'}</b>\n\nDear ${sub.name},\n\n${msgContent}\n\n<i>Aurum Vault Concierge</i>`;
            await sendActualTelegram(sub.telegram, tgMsg);
          } catch (apiErr) {
            console.error(`[Telegram Dispatch] Error during live Telegram dispatch to ${sub.telegram}:`, apiErr);
          }
        }

        sentMessages.push(newMsg);
      }

      return {
        success: true,
        updatedProduct: {
          ...product,
          price: newPrice,
          priceVal: data.newPriceVal ?? product.priceVal,
        },
        notificationsSentCount: subscribers.length,
        sentMessages,
      };
    } catch (error: any) {
      console.error("Error in triggerPriceDropOrOfferFn server handler:", error);
      throw new Error(`Failed to trigger alert: ${error.message || error}`);
    }
  });

// Server function to get store settings (gold rates and live banner)
export const getStoreSettingsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { storeSettings } = await import("./schema");
      const { eq } = await import("drizzle-orm");
      const results = await db
        .select()
        .from(storeSettings)
        .where(eq(storeSettings.id, 1))
        .limit(1);
      
      if (results.length > 0) {
        return results[0];
      }
      
      // Fallback in case seeding did not run
      return {
        id: 1,
        gold22kRate: "₹ 6,850",
        gold18kRate: "₹ 5,605",
        promoText: "✨ Special Festive Offer: 25% Off Making Charges on Gold Jewellery! ✨",
        promoActive: true,
      };
    } catch (error) {
      console.error("Error in getStoreSettingsFn server handler:", error);
      return {
        id: 1,
        gold22kRate: "₹ 6,850",
        gold18kRate: "₹ 5,605",
        promoText: "✨ Special Festive Offer: 25% Off Making Charges on Gold Jewellery! ✨",
        promoActive: true,
      };
    }
  });

// Server function to update store settings
export const updateStoreSettingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      gold22kRate: string;
      gold18kRate: string;
      promoText: string;
      promoActive: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const { storeSettings } = await import("./schema");
      const { eq } = await import("drizzle-orm");
      
      const results = await db
        .update(storeSettings)
        .set({
          gold22kRate: data.gold22kRate,
          gold18kRate: data.gold18kRate,
          promoText: data.promoText,
          promoActive: data.promoActive,
        })
        .where(eq(storeSettings.id, 1))
        .returning();
        
      return { success: true, settings: results[0] };
    } catch (error: any) {
      console.error("Error in updateStoreSettingsFn server handler:", error);
      throw new Error(`Failed to update settings: ${error.message || error}`);
    }
  });

// Server function for customer login by email (passwordless)
export const loginClientFn = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { leads } = await import("./schema");
      const { sql, desc } = await import("drizzle-orm");
      
      const cleanEmail = data.email.trim().toLowerCase();

      // Case-insensitive search on the email column
      const [client] = await db
        .select()
        .from(leads)
        .where(sql`LOWER(${leads.email}) = ${cleanEmail}`)
        .orderBy(desc(leads.createdAt))
        .limit(1);

      if (client) {
        return { success: true, client };
      } else {
        return { success: false, message: "We couldn't find an account with that email. Please register!" };
      }
    } catch (error: any) {
      console.error("Error in loginClientFn server handler:", error);
      throw new Error(`Login failed: ${error.message || error}`);
    }
  });

// Server function to clear all customer leads, alerts, and automated messages
export const clearAllLogsFn = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const { leads, priceDropAlerts, automatedMessages } = await import("./schema");
      
      // Delete in correct order of foreign key dependencies
      await db.delete(automatedMessages);
      await db.delete(priceDropAlerts);
      await db.delete(leads);
      
      return { success: true, message: "All customer database records cleared successfully! Starting fresh." };
    } catch (error: any) {
      console.error("Error clearing logs:", error);
      throw new Error(`Clear failed: ${error.message || error}`);
    }
  });


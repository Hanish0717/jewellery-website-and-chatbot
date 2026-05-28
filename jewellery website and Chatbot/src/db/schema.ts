import { pgTable, serial, text, integer, timestamp, boolean, customType } from "drizzle-orm/pg-core";

// Custom vector type for pgvector integration
const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        // Fallback for different driver returns
        const clean = value.replace(/[\[\]]/g, "");
        return clean.split(",").map(Number);
      }
    }
    return value as number[];
  }
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: text("price").notNull(), // Display price, e.g. "₹ 2,15,000"
  priceVal: integer("price_val").notNull(), // Numeric price for calculations/filtering, e.g. 215000
  category: text("category").notNull(), // "bridal", "rings", "necklaces", etc.
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  embedding: vector("embedding"),
  offerText: text("offer_text"),
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(), // e.g. "timings", "location", "offers"
  embedding: vector("embedding"),
});


// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  telegram: text("telegram"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Price Drop Alerts subscriptions table
export const priceDropAlerts = pgTable("price_drop_alerts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  telegram: text("telegram"),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  deliveryChannel: text("delivery_channel"), // "whatsapp", "email", "telegram", "all"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Logs of sent automated messages
export const automatedMessages = pgTable("automated_messages", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => priceDropAlerts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  telegram: text("telegram"),
  productName: text("product_name").notNull(),
  oldPrice: text("old_price"),
  newPrice: text("new_price"),
  message: text("message").notNull(),
  type: text("type").notNull(), // "price_drop" or "offer"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Store Settings table (for gold rates and live banners)
export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey(),
  gold22kRate: text("gold_22k_rate").notNull(),
  gold18kRate: text("gold_18k_rate").notNull(),
  promoText: text("promo_text").notNull(),
  promoActive: boolean("promo_active").default(true).notNull(),
});



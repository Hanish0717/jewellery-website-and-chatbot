import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: text("price").notNull(), // Display price, e.g. "₹ 2,15,000"
  priceVal: integer("price_val").notNull(), // Numeric price for calculations/filtering, e.g. 215000
  category: text("category").notNull(), // "bridal", "rings", "necklaces", etc.
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
});

// FAQs table
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(), // e.g. "timings", "location", "offers"
});

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

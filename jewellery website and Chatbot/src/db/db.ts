import * as dotenv from "dotenv";
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
}

const pool = new pg.Pool({
  connectionString,
});

export let isVectorSupported = false;

// Auto-initialize tables on start to bypass terminal path issues
async function initDb() {
  try {
    console.log("[initDb] Initializing database tables...");
    
    // 1. Try to enable vector extension (non-fatal if it fails)
    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
      isVectorSupported = true;
      console.log("[initDb] Vector extension initialized successfully!");
    } catch (vectorErr: any) {
      console.warn("[initDb] Warning: pgvector extension could not be enabled. Semantic vector search will fall back to keyword-based search. Reason: " + (vectorErr.message || vectorErr));
    }

    // 2. Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        price_val INTEGER NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        offer_text TEXT
      );
    `);

    // 3. Create faqs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL
      );
    `);

    // 4. Create leads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        telegram TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 5. Create price_drop_alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_drop_alerts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        telegram TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        active BOOLEAN DEFAULT TRUE NOT NULL,
        delivery_channel TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 6. Create automated_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS automated_messages (
        id SERIAL PRIMARY KEY,
        alert_id INTEGER REFERENCES price_drop_alerts(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        telegram TEXT,
        product_name TEXT NOT NULL,
        old_price TEXT,
        new_price TEXT,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 7. Create store_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id INTEGER PRIMARY KEY,
        gold_22k_rate TEXT NOT NULL,
        gold_18k_rate TEXT NOT NULL,
        promo_text TEXT NOT NULL,
        promo_active BOOLEAN DEFAULT TRUE NOT NULL
      );
    `);

    // 8. Seed default settings row if empty
    await pool.query(`
      INSERT INTO store_settings (id, gold_22k_rate, gold_18k_rate, promo_text, promo_active)
      VALUES (1, '₹ 6,850', '₹ 5,605', '✨ Special Festive Offer: 25% Off Making Charges on Gold Jewellery! ✨', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure offer_text exists for dynamic schema updates
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_text TEXT;`);
    } catch (err) {
      console.warn("[initDb] Warning: could not run offer_text migration:", err);
    }

    // Auto-seed products if the table is empty
    try {
      const prodCheck = await pool.query(`SELECT COUNT(*) FROM products;`);
      if (parseInt(prodCheck.rows[0].count) === 0) {
        console.log("[initDb] Products table is empty. Seeding luxury jewelry items...");
        const initialProducts = [
          { name: "Maharani Bridal Haar", price: "₹ 3,85,000", priceVal: 385000, category: "Bridal", description: "Temple-inspired 22K bridal necklace adorned with rubies and south sea pearls.", imageUrl: "/src/assets/p5.jpg" },
          { name: "Royal Polki Choker", price: "₹ 2,72,500", priceVal: 272500, category: "Bridal", description: "Uncut polki necklace with fine emerald beads and gold drop accents.", imageUrl: "/src/assets/p8.jpg" },
          { name: "Solitaire Brilliance Ring", price: "₹ 2,15,000", priceVal: 215000, category: "Diamond", description: "1.2ct VVS solitaire on a sleek 18K platinum and yellow gold knife-edge band.", imageUrl: "/src/assets/p3.jpg" },
          { name: "Riviera Tennis Bracelet", price: "₹ 1,68,000", priceVal: 168000, category: "Diamond", description: "Channel-set round brilliant diamonds along a flexible 18K white gold link.", imageUrl: "/src/assets/p7.jpg" },
          { name: "Empress Chandelier Drops", price: "₹ 92,800", priceVal: 92800, category: "Earrings", description: "Pear-cut diamonds suspended on filigree 18K gold chandelier drops.", imageUrl: "/src/assets/p4.jpg" },
          { name: "Aurelia Diamond Pendant", price: "₹ 48,500", priceVal: 48500, category: "Diamond", description: "Cushion-cut central diamond framed in a halo of 18K rose gold.", imageUrl: "/src/assets/p1.jpg" },
          { name: "Majestic Peacock Jhumkas", price: "₹ 1,12,000", priceVal: 112000, category: "Earrings", description: "Exquisite 22K gold jhumkas featuring detailed peacock carvings and seed pearl fringes.", imageUrl: "/src/assets/p2.jpg" },
          { name: "Temple Heritage Haram", price: "₹ 3,20,000", priceVal: 320000, category: "Gold Necklace", description: "Long 22K gold heritage haram necklace depicting goddess Lakshmi with floral medallions.", imageUrl: "/src/assets/p6.jpg" },
          { name: "Aura Gold Bangle Set", price: "₹ 1,45,000", priceVal: 145000, category: "Gold Necklace", description: "Pair of antique-finished 22K gold kadas with detailed geometric engraving.", imageUrl: "/src/assets/cat-necklace.jpg" },
          { name: "Shahi Kundan Set", price: "₹ 4,50,000", priceVal: 450000, category: "Wedding Collection", description: "Ornate kundan necklace with matching drop earrings, backed by fine meenakari work.", imageUrl: "/src/assets/cat-wedding.jpg" },
          { name: "Nizam Gemstone Choker", price: "₹ 5,10,000", priceVal: 510000, category: "Wedding Collection", description: "Magnificent multi-layered necklace of Zambian emerald beads and certified uncut diamonds.", imageUrl: "/src/assets/cat-bridal.jpg" },
          { name: "Dewdrop Diamond Studs", price: "₹ 64,200", priceVal: 64200, category: "Earrings", description: "Classic three-stone diamond cluster studs shaped like morning dewdrops.", imageUrl: "/src/assets/p4.jpg" },
          { name: "Elegant Gold Choker", price: "₹ 1,85,000", priceVal: 185000, category: "Gold Necklace", description: "Modern collar choker crafted in brushed and polished 22K yellow gold.", imageUrl: "/src/assets/cat-necklace.jpg" },
          { name: "Floral Diamond Bangle", price: "₹ 2,30,000", priceVal: 230000, category: "Diamond", description: "Delicate diamond bangle in 18K white gold with repeating jasmine motifs.", imageUrl: "/src/assets/cat-diamond.jpg" },
          { name: "Bridal Matha Patti", price: "₹ 95,000", priceVal: 95000, category: "Bridal", description: "Forehead ornament in 22K gold plated silver with kundan and rubies.", imageUrl: "/src/assets/p2.jpg" },
          { name: "Antique Lakshmi Kasu", price: "₹ 2,90,000", priceVal: 290000, category: "Gold Necklace", description: "A classic Kasulaperu coin necklace featuring repetitive coins of Goddess Lakshmi.", imageUrl: "/src/assets/p6.jpg" },
          { name: "Princess Engagement Ring", price: "₹ 3,40,000", priceVal: 340000, category: "Diamond", description: "Stunning 1.5ct princess cut diamond on a pave-set white gold diamond band.", imageUrl: "/src/assets/p3.jpg" },
          { name: "Emerald Drop Earrings", price: "₹ 1,55,000", priceVal: 155000, category: "Earrings", description: "High-end drop earrings combining emerald cut green emeralds and teardrop diamonds.", imageUrl: "/src/assets/cat-earrings.jpg" },
          { name: "Traditional Polki Nath", price: "₹ 55,000", priceVal: 55000, category: "Wedding Collection", description: "Elegant nose ring set with polki diamonds and ruby beads.", imageUrl: "/src/assets/p1.jpg" },
          { name: "Heritage Bridal Vanki", price: "₹ 1,25,000", priceVal: 125000, category: "Wedding Collection", description: "V-shaped armlet with peacock motifs, rubies, and emeralds.", imageUrl: "/src/assets/p8.jpg" }
        ];
        for (const p of initialProducts) {
          await pool.query(
            `INSERT INTO products (name, price, price_val, category, description, image_url) VALUES ($1, $2, $3, $4, $5, $6);`,
            [p.name, p.price, p.priceVal, p.category, p.description, p.imageUrl]
          );
        }
        console.log("[initDb] Products seeded successfully.");
      }
    } catch (prodSeedErr) {
      console.warn("[initDb] Warning: products auto-seeding failed:", prodSeedErr);
    }

    // Auto-seed FAQs if the table is empty
    try {
      const faqCheck = await pool.query(`SELECT COUNT(*) FROM faqs;`);
      if (parseInt(faqCheck.rows[0].count) === 0) {
        console.log("[initDb] FAQs table is empty. Seeding FAQ entries...");
        const initialFAQs = [
          { question: "What is your store location / address?", answer: "Our flagship atelier is located at Plot 14, Road 36, Jubilee Hills, Hyderabad — open daily from 10:30 AM to 9:00 PM.", category: "location" },
          { question: "What are your store timings?", answer: "We are open daily from 10:30 AM to 9:00 PM. Appointments are recommended for custom bridal jewellery consultations.", category: "timings" },
          { question: "Do you create custom jewelry designs?", answer: "Yes, we specialize in bespoke, custom jewellery. You can collaborate with our master artisans to sketch and create your dream design. Process takes 4-6 weeks.", category: "customization" },
          { question: "Is your jewellery certified and pure?", answer: "All our gold jewellery is 100% BIS Hallmarked (22K or 18K), and our diamonds are certified by leading global gemological labs like IGI, GIA, and SGL.", category: "purity" },
          { question: "What is your return and buyback policy?", answer: "We offer a 7-day exchange for unused jewellery in original packaging, along with a lifetime buyback and exchange guarantee on current gold and diamond rates.", category: "policy" },
          { question: "How can I book a bridal appointment?", answer: "You can book an appointment by asking me directly to book a visit or calling our Jubilee Hills atelier. We suggest booking 2 days in advance.", category: "appointment" },
          { question: "Are there any running offers or discounts?", answer: "We currently offer up to 25% off on making charges for gold jewellery and a zero-deduction value upgrade on certified diamonds.", category: "offers" },
          { question: "Do you ship outside Hyderabad?", answer: "Yes, we provide fully insured, secure nationwide shipping across India. All shipments are trackable and safe.", category: "shipping" },
          { question: "What payment methods do you accept?", answer: "We accept all major credit cards, debit cards, UPI, net banking (NEFT/RTGS), and official store gift vouchers.", category: "payment" },
          { question: "How should I clean and care for my jewellery?", answer: "Avoid exposing jewellery to harsh chemicals, perfumes, or water. We provide complimentary professional ultrasonic cleaning and polishing services at our store.", category: "care" },
          { question: "Are your gold rates updated daily?", answer: "Yes, our product prices fluctuate daily in accordance with international gold and diamond board rates to ensure transparency.", category: "rates" },
          { question: "What are your making charges?", answer: "Our making charges start from a highly competitive 8%, depending on the complexity and handcrafting involved in the piece.", category: "charges" },
          { question: "Do your products come in premium packaging?", answer: "Yes, all purchases come in our signature luxury velvet box, together with certificates of authenticity and detailed care guides, ready for gifting.", category: "packaging" },
          { question: "Do you evaluate heirloom jewellery?", answer: "Yes, we offer certified in-store valuation services for ancestral and vintage jewellery by our in-house gemologists.", category: "evaluation" },
          { question: "Can I do a virtual video-call consultation?", answer: "Yes, we offer video call viewings via WhatsApp or Zoom. Our consultants will show you pieces in real-time, and we can arrange secured delivery.", category: "virtual" }
        ];
        for (const f of initialFAQs) {
          await pool.query(
            `INSERT INTO faqs (question, answer, category) VALUES ($1, $2, $3);`,
            [f.question, f.answer, f.category]
          );
        }
        console.log("[initDb] FAQs seeded successfully.");
      }
    } catch (faqSeedErr) {
      console.warn("[initDb] Warning: FAQs auto-seeding failed:", faqSeedErr);
    }

    // 9. Try to add vector columns if pgvector is enabled (non-fatal if it fails)
    try {
      await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(768);`);
      await pool.query(`ALTER TABLE faqs ADD COLUMN IF NOT EXISTS embedding vector(768);`);
      console.log("[initDb] Dynamic vector columns verified/added.");
    } catch (colErr) {
      console.warn("[initDb] Warning: embedding columns could not be added. (pgvector might be disabled).");
    }

    // 10. Dynamic migrations for Multi-Channel Notification Columns
    try {
      console.log("[initDb] Running dynamic migrations for multi-channel notification columns...");
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;`);
      await pool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS telegram TEXT;`);

      await pool.query(`ALTER TABLE price_drop_alerts ADD COLUMN IF NOT EXISTS email TEXT;`);
      await pool.query(`ALTER TABLE price_drop_alerts ADD COLUMN IF NOT EXISTS telegram TEXT;`);
      await pool.query(`ALTER TABLE price_drop_alerts ADD COLUMN IF NOT EXISTS delivery_channel TEXT;`);

      await pool.query(`ALTER TABLE automated_messages ADD COLUMN IF NOT EXISTS email TEXT;`);
      await pool.query(`ALTER TABLE automated_messages ADD COLUMN IF NOT EXISTS telegram TEXT;`);
      console.log("[initDb] Dynamic migrations completed successfully!");
    } catch (migErr) {
      console.warn("[initDb] Warning: failed to run multi-channel alerts migrations:", migErr);
    }

    console.log("[initDb] Database tables initialized successfully!");
  } catch (error) {
    console.error("[initDb] Failed to initialize database tables:", error);
  }
}

export const initPromise = initDb();


export const db = drizzle(pool, { schema });


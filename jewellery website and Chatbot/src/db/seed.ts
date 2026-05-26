import { db } from "./db";
import { products, faqs } from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

// 20 Luxury Jewellery Products
const productData = [
  { name: "Aurelia Diamond Pendant", price: "₹ 48,500", priceVal: 48500, category: "Pendants", description: "Cushion-cut centre stone framed in 18K rose gold.", imageUrl: "/src/assets/p1.jpg" },
  { name: "Heritage Gold Bangles", price: "₹ 1,24,000", priceVal: 124000, category: "Bangles", description: "Stack of six, finely beaded 22K bangles.", imageUrl: "/src/assets/p2.jpg" },
  { name: "Solitaire Brilliance Ring", price: "₹ 2,15,000", priceVal: 215000, category: "Rings", description: "1.2ct VVS solitaire on a knife-edge band.", imageUrl: "/src/assets/p3.jpg" },
  { name: "Empress Chandelier Drops", price: "₹ 92,800", priceVal: 92800, category: "Earrings", description: "Pear-cut diamonds suspended on filigree gold.", imageUrl: "/src/assets/p4.jpg" },
  { name: "Maharani Bridal Haar", price: "₹ 3,85,000", priceVal: 385000, category: "Bridal", description: "Temple-inspired 22K bridal necklace.", imageUrl: "/src/assets/p5.jpg" },
  { name: "Noor Mangalsutra", price: "₹ 56,200", priceVal: 56200, category: "Mangalsutra", description: "Modern halo pendant on twin-string black beads.", imageUrl: "/src/assets/p6.jpg" },
  { name: "Riviera Tennis Bracelet", price: "₹ 1,68,000", priceVal: 168000, category: "Bracelets", description: "Channel-set diamonds along a flexible link.", imageUrl: "/src/assets/p7.jpg" },
  { name: "Royal Polki Choker", price: "₹ 2,72,500", priceVal: 272500, category: "Bridal", description: "Uncut polki with emerald and ruby accents.", imageUrl: "/src/assets/p8.jpg" },
  { name: "Divine Temple Choker", price: "₹ 1,95,000", priceVal: 195000, category: "Bridal", description: "Traditional temple-style polki choker with antique gold finish.", imageUrl: "/src/assets/p5.jpg" },
  { name: "Shimmering Halo Ring", price: "₹ 78,000", priceVal: 78000, category: "Rings", description: "Oval diamond center piece surrounded by micro-pavé diamonds.", imageUrl: "/src/assets/p3.jpg" },
  { name: "Vintage Emerald Drops", price: "₹ 1,12,000", priceVal: 112000, category: "Earrings", description: "Rich green Colombian emeralds surrounded by diamond halos.", imageUrl: "/src/assets/p4.jpg" },
  { name: "Classic Gold Kada", price: "₹ 1,45,000", priceVal: 145000, category: "Bangles", description: "Handcrafted 22K yellow gold kada with intricate floral carvings.", imageUrl: "/src/assets/p2.jpg" },
  { name: "Elegant Diamond Studs", price: "₹ 52,000", priceVal: 52000, category: "Earrings", description: "Minimalist round-cut diamond studs in 18K white gold.", imageUrl: "/src/assets/p4.jpg" },
  { name: "Eternal Bond Band", price: "₹ 65,000", priceVal: 65000, category: "Rings", description: "Classic platinum eternity band studded with brilliant-cut diamonds.", imageUrl: "/src/assets/p3.jpg" },
  { name: "Majestic Peacock Necklace", price: "₹ 2,35,000", priceVal: 235000, category: "Necklaces", description: "Elaborate 22K gold necklace featuring a peacock motif with enamel inlay.", imageUrl: "/src/assets/p5.jpg" },
  { name: "Aureate Gold Chain", price: "₹ 85,000", priceVal: 85000, category: "Necklaces", description: "Sleek 22K gold rope chain, perfect for daily wear or pendants.", imageUrl: "/src/assets/p1.jpg" },
  { name: "Celestial Moon Pendant", price: "₹ 42,000", priceVal: 42000, category: "Pendants", description: "Crescent moon pendant in 18K gold encrusted with tiny diamonds.", imageUrl: "/src/assets/p1.jpg" },
  { name: "Dewdrop Diamond Bracelet", price: "₹ 1,35,000", priceVal: 135000, category: "Bracelets", description: "Delicate gold chain with floating bezel-set diamonds.", imageUrl: "/src/assets/p7.jpg" },
  { name: "Imperial Ruby Choker", price: "₹ 2,90,000", priceVal: 290000, category: "Bridal", description: "Stunning neckpiece with pigeon-blood rubies and uncut diamonds.", imageUrl: "/src/assets/p8.jpg" },
  { name: "Graceful Flora Bangle", price: "₹ 1,18,000", priceVal: 118000, category: "Bangles", description: "Hinged 18K rose gold bangle featuring diamond floral patterns.", imageUrl: "/src/assets/p2.jpg" },
];

// 15 Store FAQs
const faqData = [
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
  { question: "Can I do a virtual video-call consultation?", answer: "Yes, we offer video call viewings via WhatsApp or Zoom. Our consultants will show you pieces in real-time, and we can arrange secured delivery.", category: "virtual" },
];

async function seed() {
  console.log("Starting database seed...");

  // 1. Clear existing entries
  try {
    console.log("Cleaning existing database records...");
    await db.delete(products);
    await db.delete(faqs);
  } catch (error) {
    console.warn("Table clearing failed (may not exist yet):", error);
  }

  // 2. Seed Products
  console.log("Seeding products...");
  for (const product of productData) {
    await db.insert(products).values({
      name: product.name,
      price: product.price,
      priceVal: product.priceVal,
      category: product.category,
      description: product.description,
      imageUrl: product.imageUrl,
    });
  }
  console.log(`Successfully seeded ${productData.length} products!`);

  // 3. Seed FAQs
  console.log("Seeding FAQs...");
  for (const faq of faqData) {
    await db.insert(faqs).values({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
  }
  console.log(`Successfully seeded ${faqData.length} FAQs!`);

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});

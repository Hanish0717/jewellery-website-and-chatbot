import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Collections } from "@/components/Collections";
import { Products } from "@/components/Products";
import { WhyUs } from "@/components/WhyUs";
import { Testimonials } from "@/components/Testimonials";
import { Store } from "@/components/Store";
import { Footer } from "@/components/Footer";
import { ChatWidget, type ChatHandle } from "@/components/ChatWidget";
// Removed AdminPanel import to convert it to a dedicated route

import { getProductsFn, getStoreSettingsFn } from "@/db/serverFunctions";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [dbProducts, storeSettings] = await Promise.all([
        getProductsFn(),
        getStoreSettingsFn()
      ]);
      return { dbProducts, storeSettings };
    } catch (e) {
      console.warn("Failed to load products in route loader:", e);
      return { 
        dbProducts: [], 
        storeSettings: {
          id: 1,
          gold22kRate: "₹ 6,850",
          gold18kRate: "₹ 5,605",
          promoText: "✨ Special Festive Offer: 25% Off Making Charges on Gold Jewellery! ✨",
          promoActive: true,
        }
      };
    }
  },
  head: () => ({
    meta: [
      { title: "Aurum Vault — Luxury Gold & Diamond Jewellery, Palakonda" },
      {
        name: "description",
        content:
          "Aurum Vault: heritage gold and diamond jewellery atelier in Palakonda. Bridal, diamond and wedding collections with an AI jewellery consultant.",
      },
      { property: "og:title", content: "Aurum Vault — Luxury Jewellery, Palakonda" },
      {
        property: "og:description",
        content: "Timeless gold and diamond jewellery with an AI consultant.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { dbProducts, storeSettings } = Route.useLoaderData();
  const router = useRouter();
  const chatRef = useRef<ChatHandle | null>(null);
  const openChat = () => chatRef.current?.open();
  const askAi = (name: string) => chatRef.current?.askAbout(name);

  // Auto-refresh storefront data when browser tab gets focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("[Storefront] Window focused. Invalidating router cache to pull latest rates/prices...");
      router.invalidate();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  return (
    <div className="bg-background text-foreground">
      <Navbar onOpenChat={openChat} storeSettings={storeSettings} />
      <main>
        <Hero onOpenChat={openChat} />
        <Collections />
        <section id="bridal">
          <Products products={dbProducts} onAskAi={askAi} />
        </section>
        <WhyUs />
        <Testimonials />
        <Store />
      </main>
      <Footer />
      <ChatWidget handleRef={chatRef} />
    </div>
  );
}


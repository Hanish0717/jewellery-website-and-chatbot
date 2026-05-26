import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Collections } from "@/components/Collections";
import { Products } from "@/components/Products";
import { WhyUs } from "@/components/WhyUs";
import { Testimonials } from "@/components/Testimonials";
import { Store } from "@/components/Store";
import { Footer } from "@/components/Footer";
import { ChatWidget, type ChatHandle } from "@/components/ChatWidget";

export const Route = createFileRoute("/")({
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
  const chatRef = useRef<ChatHandle | null>(null);
  const openChat = () => chatRef.current?.open();
  const askAi = (name: string) => chatRef.current?.askAbout(name);

  return (
    <div className="bg-background text-foreground">
      <Navbar onOpenChat={openChat} />
      <main>
        <Hero onOpenChat={openChat} />
        <Collections />
        <section id="bridal">
          <Products onAskAi={askAi} />
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

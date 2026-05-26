import hero from "@/assets/hero.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section id="home" className="relative min-h-[100svh] w-full overflow-hidden">
      <img
        src={hero}
        alt="Luxury gold and diamond necklace"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-gold backdrop-blur-md">
          <Sparkles className="h-3 w-3" /> Est. 2003 · Hyderabad
        </div>

        <h1
          className="animate-fade-up font-display text-4xl leading-[1.05] text-white sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animationDelay: "0.1s" }}
        >
          Discover Timeless <br className="hidden sm:block" />
          <span className="italic text-gold">Gold &amp; Diamond</span> Jewellery
        </h1>

        <p
          className="animate-fade-up mx-auto mt-7 max-w-xl text-sm leading-relaxed text-white/75 md:text-base"
          style={{ animationDelay: "0.25s" }}
        >
          Heirloom craftsmanship for the moments that define you — from bridal heritage to
          everyday elegance, designed with quiet luxury in mind.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          style={{ animationDelay: "0.4s" }}
        >
          <a
            href="#collections"
            className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-ink transition-all hover:bg-gold-light"
          >
            Explore Collections
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:border-gold hover:text-gold"
          >
            <Sparkles className="h-3.5 w-3.5" /> Chat With Expert
          </button>
        </div>

        <div className="animate-fade-in absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/50 md:flex">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="h-12 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </div>
    </section>
  );
}

import hero from "@/assets/hero.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <section id="home" className="relative min-h-[85svh] lg:min-h-[88vh] w-full overflow-hidden">
      <img
        src={hero}
        alt="Luxury gold and diamond necklace"
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover z-0"
      />
      {/* Dark Vignette Overlay and Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/95 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.7)_100%)] z-0" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-0" />

      {/* Floating Sparkles & Light Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[15%] h-64 w-64 rounded-full bg-gold/10 blur-[80px] animate-float-slow" />
        <div className="absolute bottom-[25%] right-[10%] h-80 w-80 rounded-full bg-gold/5 blur-[100px] animate-float-medium" />
        <div className="absolute top-[35%] right-[25%] h-40 w-40 rounded-full bg-gold/8 blur-[50px] animate-float-fast" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[85svh] lg:min-h-[88vh] max-w-7xl flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gold backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-gold/80" /> Est. 2003 · Hyderabad
        </div>

        <div className="max-w-4xl bg-black/15 backdrop-blur-[1px] p-6 rounded-2xl">
          <h1
            className="animate-fade-up font-display text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl lg:text-7xl tracking-wide text-glow"
            style={{ animationDelay: "0.1s" }}
          >
            Discover Timeless <br className="hidden sm:block" />
            <span className="italic text-gold">Gold &amp; Diamond</span> Jewellery
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-xs md:text-sm leading-relaxed text-white/80 font-light"
            style={{ animationDelay: "0.25s" }}
          >
            Heirloom craftsmanship for the moments that define you — from bridal heritage to
            everyday elegance, designed with quiet luxury in mind.
          </p>
        </div>

        <div
          className="animate-fade-up mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
          style={{ animationDelay: "0.4s" }}
        >
          <a
            href="#collections"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gold px-8 py-4 text-xs uppercase tracking-[0.2em] text-ink font-semibold transition-all hover:bg-gold-light hover:scale-[1.02] shadow-lg shadow-gold/10"
          >
            Explore Collections
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <button
            onClick={onOpenChat}
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-xs uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all hover:border-gold hover:text-gold hover:bg-white/10 hover:scale-[1.02]"
          >
            <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" /> Chat With Expert
          </button>
        </div>

        {/* Luxury Trust Indicators */}
        <div 
          className="animate-fade-in mt-14 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-[10px] tracking-[0.22em] text-white/50 uppercase border-t border-white/10 pt-8"
          style={{ animationDelay: "0.55s" }}
        >
          <span className="flex items-center gap-2"><span className="text-gold text-xs">✔</span> BIS Hallmarked</span>
          <span className="hidden sm:inline h-3 w-px bg-white/15" />
          <span className="flex items-center gap-2"><span className="text-gold text-xs">✔</span> Certified Diamonds</span>
          <span className="hidden sm:inline h-3 w-px bg-white/15" />
          <span className="flex items-center gap-2"><span className="text-gold text-xs">✔</span> Since 2003</span>
        </div>

        <div className="animate-fade-in absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 md:flex">
          <span className="text-[9px] uppercase tracking-[0.35em] font-light">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-white/40 to-transparent animate-shimmer" />
        </div>
      </div>
    </section>
  );
}

import bridal from "@/assets/cat-bridal.jpg";
import necklace from "@/assets/cat-necklace.jpg";
import earrings from "@/assets/cat-earrings.jpg";
import diamond from "@/assets/cat-diamond.jpg";
import wedding from "@/assets/cat-wedding.jpg";
import { ArrowUpRight } from "lucide-react";

const items = [
  { title: "Bridal Sets", subtitle: "Heritage · Hand-crafted", img: bridal, span: "md:col-span-2 md:row-span-2" },
  { title: "Gold Necklaces", subtitle: "22K · 18K", img: necklace, span: "" },
  { title: "Earrings", subtitle: "Diamond drops & studs", img: earrings, span: "" },
  { title: "Diamond Jewellery", subtitle: "GIA Certified", img: diamond, span: "md:col-span-2" },
  { title: "Wedding Collections", subtitle: "Temple & Polki", img: wedding, span: "" },
];

export function Collections() {
  return (
    <section id="collections" className="relative px-6 py-24 md:px-12 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-start justify-between gap-8 md:mb-24 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">— Featured Collections</p>
            <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl tracking-wide">
              Curated for the <em className="text-gold not-italic font-light">connoisseur</em>
            </h2>
          </div>
          <p className="max-w-md text-xs md:text-sm leading-relaxed text-muted-foreground font-light">
            Each piece is a celebration of tradition, designed by master artisans and finished
            with uncompromising attention to detail and GIA-certified stones.
          </p>
        </div>

        <div className="grid auto-rows-[340px] grid-cols-1 gap-6 md:grid-cols-3 md:auto-rows-[280px] lg:auto-rows-[350px] lg:gap-8">
          {items.map((it) => (
            <a
              key={it.title}
              href="#products"
              className={`group relative overflow-hidden rounded-lg bg-ink shadow-lg transition-all duration-700 ${it.span}`}
            >
              {/* Image with slow zoom transition */}
              <img
                src={it.img}
                alt={it.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105"
              />
              
              {/* Ambient Vignette & Color Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 transition-opacity duration-700 group-hover:opacity-95" />
              
              {/* Inner Decorative Gold Border on Hover */}
              <div className="absolute inset-4 border border-gold/0 transition-all duration-700 group-hover:border-gold/20 z-10 pointer-events-none rounded-md" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 z-20">
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-gold/90 font-medium">{it.subtitle}</p>
                  <h3 className="mt-2 font-display text-2xl text-white md:text-3xl tracking-wide text-glow">{it.title}</h3>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink group-hover:scale-105">
                  <ArrowUpRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

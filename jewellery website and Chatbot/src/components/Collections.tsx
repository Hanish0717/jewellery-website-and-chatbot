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
    <section id="collections" className="relative px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:mb-20 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-gold">— Featured Collections</p>
            <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl">
              Curated for the <em className="text-gold not-italic">connoisseur</em>
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Each piece is a celebration of tradition, designed by master artisans and finished
            with uncompromising attention to detail.
          </p>
        </div>

        <div className="grid auto-rows-[320px] grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[260px] lg:auto-rows-[300px]">
          {items.map((it) => (
            <a
              key={it.title}
              href="#products"
              className={`group relative overflow-hidden rounded-sm bg-muted ${it.span}`}
            >
              <img
                src={it.img}
                alt={it.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gold/90">{it.subtitle}</p>
                  <h3 className="mt-2 font-display text-2xl text-white md:text-3xl">{it.title}</h3>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-all group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

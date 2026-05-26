import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import { Sparkles } from "lucide-react";

const products = [
  { name: "Aurelia Diamond Pendant", price: "₹ 48,500", cat: "Pendants", desc: "Cushion-cut centre stone framed in 18K rose gold.", img: p1 },
  { name: "Heritage Gold Bangles", price: "₹ 1,24,000", cat: "Bangles", desc: "Stack of six, finely beaded 22K bangles.", img: p2 },
  { name: "Solitaire Brilliance Ring", price: "₹ 2,15,000", cat: "Rings", desc: "1.2ct VVS solitaire on a knife-edge band.", img: p3 },
  { name: "Empress Chandelier Drops", price: "₹ 92,800", cat: "Earrings", desc: "Pear-cut diamonds suspended on filigree gold.", img: p4 },
  { name: "Maharani Bridal Haar", price: "₹ 3,85,000", cat: "Bridal", desc: "Temple-inspired 22K bridal necklace.", img: p5 },
  { name: "Noor Mangalsutra", price: "₹ 56,200", cat: "Mangalsutra", desc: "Modern halo pendant on twin-string black beads.", img: p6 },
  { name: "Riviera Tennis Bracelet", price: "₹ 1,68,000", cat: "Bracelets", desc: "Channel-set diamonds along a flexible link.", img: p7 },
  { name: "Royal Polki Choker", price: "₹ 2,72,500", cat: "Bridal", desc: "Uncut polki with emerald and ruby accents.", img: p8 },
];

export function Products({ onAskAi }: { onAskAi: (name: string) => void }) {
  return (
    <section id="products" className="bg-cream px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center md:mb-20">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-gold">— The Atelier</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl">Signature pieces</h2>
          <div className="gold-divider mx-auto mt-6 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article key={p.name} className="group flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-white">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink">
                  {p.cat}
                </span>
              </div>
              <div className="mt-5 flex flex-col flex-1">
                <h3 className="font-display text-lg text-ink leading-snug">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.desc}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium tracking-wide text-ink">{p.price}</span>
                </div>
                <button
                  onClick={() => onAskAi(p.name)}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-transparent px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-ink transition-all hover:border-gold hover:bg-ink hover:text-gold"
                >
                  <Sparkles className="h-3 w-3" /> Ask AI About This
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

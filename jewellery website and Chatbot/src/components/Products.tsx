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
  { name: "Maharani Bridal Haar", price: "₹ 3,85,000", cat: "Bridal", desc: "Temple-inspired 22K bridal necklace adorned with rubies and south sea pearls.", img: p5 },
  { name: "Royal Polki Choker", price: "₹ 2,72,500", cat: "Bridal", desc: "Uncut polki necklace with fine emerald beads and gold drop accents.", img: p8 },
  { name: "Solitaire Brilliance Ring", price: "₹ 2,15,000", cat: "Rings", desc: "1.2ct VVS solitaire on a sleek 18K platinum and yellow gold knife-edge band.", img: p3 },
  { name: "Riviera Tennis Bracelet", price: "₹ 1,68,000", cat: "Bracelets", desc: "Channel-set round brilliant diamonds along a flexible 18K white gold link.", img: p7 },
  { name: "Empress Chandelier Drops", price: "₹ 92,800", cat: "Earrings", desc: "Pear-cut diamonds suspended on filigree 18K gold chandelier drops.", img: p4 },
  { name: "Aurelia Diamond Pendant", price: "₹ 48,500", cat: "Pendants", desc: "Cushion-cut central diamond framed in a halo of 18K rose gold.", img: p1 },
];

export function Products({
  products: dbProducts,
  onAskAi,
}: {
  products?: { name: string; price: string; category: string; description: string; imageUrl: string }[];
  onAskAi: (name: string) => void;
}) {
  const displayProducts =
    dbProducts && dbProducts.length > 0
      ? dbProducts.map((p) => {
          let img = p.imageUrl;
          if (p.imageUrl === "/src/assets/p1.jpg") img = p1;
          else if (p.imageUrl === "/src/assets/p2.jpg") img = p2;
          else if (p.imageUrl === "/src/assets/p3.jpg") img = p3;
          else if (p.imageUrl === "/src/assets/p4.jpg") img = p4;
          else if (p.imageUrl === "/src/assets/p5.jpg") img = p5;
          else if (p.imageUrl === "/src/assets/p6.jpg") img = p6;
          else if (p.imageUrl === "/src/assets/p7.jpg") img = p7;
          else if (p.imageUrl === "/src/assets/p8.jpg") img = p8;
          return {
            name: p.name,
            price: p.price,
            cat: p.category,
            desc: p.description,
            img,
          };
        })
      : products;

  return (
    <section id="products" className="bg-cream/40 px-6 py-24 md:px-12 md:py-32 border-y border-gold/10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center md:mb-24">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">— Signature Atelier</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl tracking-wide">Signature Pieces</h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-80" />
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {displayProducts.map((p) => (
            <article 
              key={p.name} 
              className="group flex flex-col bg-white border border-gold/10 rounded-2xl p-5 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] hover:-translate-y-2"
            >
              {/* Product Image Frame */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-gold/5">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 border border-gold/20 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink font-medium shadow-sm">
                  {p.cat}
                </span>
              </div>

              {/* Product Metadata & Actions */}
              <div className="mt-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-display text-xl text-ink leading-snug tracking-wide">{p.name}</h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground font-light leading-relaxed min-h-[40px]">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-5 border-t border-gold/10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Estimated Price</span>
                    <span className="text-base md:text-lg font-semibold tracking-wide text-ink">{p.price}</span>
                  </div>
                  <button
                    onClick={() => onAskAi(p.name)}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-ink/80 bg-transparent py-3.5 text-[10px] uppercase tracking-[0.22em] text-ink font-semibold transition-all duration-300 hover:bg-ink hover:text-gold hover:scale-[1.02] shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold" /> Ask AI About This
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

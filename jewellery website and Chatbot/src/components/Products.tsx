import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import productsData from "@/data/products.json";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Import all product assets to compile correctly under Vite
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import catBridal from "@/assets/cat-bridal.jpg";
import catDiamond from "@/assets/cat-diamond.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catNecklace from "@/assets/cat-necklace.jpg";
import catWedding from "@/assets/cat-wedding.jpg";

const imageMap: Record<string, string> = {
  "p1.jpg": p1,
  "p2.jpg": p2,
  "p3.jpg": p3,
  "p4.jpg": p4,
  "p5.jpg": p5,
  "p6.jpg": p6,
  "p7.jpg": p7,
  "p8.jpg": p8,
  "cat-bridal.jpg": catBridal,
  "cat-diamond.jpg": catDiamond,
  "cat-earrings.jpg": catEarrings,
  "cat-necklace.jpg": catNecklace,
  "cat-wedding.jpg": catWedding,
};

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  craftsmanship: string;
  image: string;
  tags: string[];
}

const filters = ["All", "Bridal", "Gold", "Diamond", "Earrings", "Wedding"];

const matchesFilter = (productCategory: string, filter: string) => {
  if (filter === "All") return true;
  if (filter === "Gold") return productCategory === "Gold Necklace";
  if (filter === "Wedding") return productCategory === "Wedding Collection";
  return productCategory === filter;
};

export function Products({ onAskAi }: { onAskAi: (name: string) => void }) {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = (productsData as Product[]).filter((p) =>
    matchesFilter(p.category, selectedFilter),
  );

  return (
    <section
      id="products"
      className="bg-cream/40 px-6 py-24 md:px-12 md:py-32 border-y border-gold/10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">
            — Signature Atelier
          </p>
          <h2 className="font-display text-4xl text-ink md:text-5xl tracking-wide">
            Signature Pieces
          </h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-80" />
        </div>

        {/* Luxury Pill-Style Filter Tabs */}
        <div className="mb-16 flex flex-wrap justify-center gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer ${
                selectedFilter === filter
                  ? "bg-ink text-gold border border-gold/30 shadow-md scale-[1.02]"
                  : "bg-white/60 border border-gold/5 text-ink/75 hover:text-ink hover:border-gold/25 hover:bg-cream/50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col bg-white border border-gold/10 rounded-2xl p-5 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] hover:-translate-y-2"
            >
              {/* Product Image Frame (Clickable) */}
              <div
                onClick={() => setSelectedProduct(p)}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-gold/5 cursor-pointer"
              >
                <img
                  src={imageMap[p.image] || p1}
                  alt={p.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 border border-gold/20 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink font-medium shadow-sm">
                  {p.category}
                </span>
              </div>

              {/* Product Metadata & Actions */}
              <div className="mt-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3
                    onClick={() => setSelectedProduct(p)}
                    className="font-display text-xl text-ink leading-snug tracking-wide cursor-pointer hover:text-gold transition-colors"
                  >
                    {p.name}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground font-light leading-relaxed min-h-[40px] line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 pt-5 border-t border-gold/10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Estimated Price
                    </span>
                    <span className="text-base md:text-lg font-semibold tracking-wide text-ink">
                      {p.price}
                    </span>
                  </div>
                  <button
                    onClick={() => onAskAi(p.name)}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-ink/80 bg-transparent py-3.5 text-[10px] uppercase tracking-[0.22em] text-ink font-semibold transition-all duration-300 hover:bg-ink hover:text-gold hover:scale-[1.02] shadow-sm cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold animate-shimmer" /> Ask AI About This
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Luxury Product Detail Modal */}
      <Dialog
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden bg-white/95 border border-gold/20 p-0 md:rounded-2xl shadow-2xl glass-luxury w-[90vw] max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Product Image */}
              <div className="relative aspect-square md:aspect-auto md:h-full min-h-[320px] bg-muted border-r border-gold/10">
                <img
                  src={imageMap[selectedProduct.image] || p1}
                  alt={selectedProduct.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 border border-gold/20 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink font-medium shadow-sm">
                  {selectedProduct.category}
                </span>
              </div>

              {/* Right Column: Dynamic Info Sheet */}
              <div className="flex flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">
                      Atelier Original
                    </span>
                    <span className="text-lg font-semibold tracking-wide text-ink">
                      {selectedProduct.price}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-2xl md:text-3xl text-ink leading-tight tracking-wide">
                    {selectedProduct.name}
                  </h3>

                  <div className="gold-divider my-4 opacity-50" />

                  <p className="text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="mt-6 p-4 rounded-xl bg-cream/40 border border-gold/10">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-gold font-semibold mb-2">
                      Master Craftsmanship
                    </p>
                    <p className="text-xs leading-relaxed text-ink/80 font-light">
                      {selectedProduct.craftsmanship}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-gold/10 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      onAskAi(selectedProduct.name);
                      setSelectedProduct(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-ink py-4 text-[10px] uppercase tracking-[0.22em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink hover:scale-[1.02] shadow-md border border-gold/20 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold" /> Ask AI About This
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full inline-flex items-center justify-center py-2 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium hover:text-ink transition-colors cursor-pointer"
                  >
                    Return to Atelier
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

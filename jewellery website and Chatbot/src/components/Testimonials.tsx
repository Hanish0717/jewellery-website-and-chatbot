import { Quote } from "lucide-react";

const reviews = [
  { name: "Ananya R.", role: "Bride, 2024", text: "The bridal set was a dream — every artisan detail showed. The expert consultation made choosing effortless." },
  { name: "Vikram & Priya", role: "Anniversary", text: "We've been clients for a decade. The craftsmanship and trust they've built is simply unmatched in Hyderabad." },
  { name: "Sneha K.", role: "Diamond Connoisseur", text: "Certified, transparent, and exquisite. The solitaire I purchased exceeded every expectation I had set." },
];

export function Testimonials() {
  return (
    <section className="bg-cream/25 px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center md:mb-24">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">— Patron Stories</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl tracking-wide">In Their Words</h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-60" />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="flex flex-col justify-between bg-white border border-gold/15 p-8 md:p-10 rounded-2xl transition-all duration-500 hover:shadow-[0_20px_45px_rgba(212,175,55,0.08)] hover:-translate-y-1.5"
            >
              <div className="flex flex-col gap-6">
                <Quote className="h-7 w-7 text-gold/80" />
                <blockquote className="font-display text-lg leading-relaxed text-ink/90 font-light italic">
                  "{r.text}"
                </blockquote>
              </div>
              <figcaption className="mt-10">
                <div className="gold-divider mb-4 w-12 opacity-55" />
                <p className="text-sm font-semibold tracking-wide text-ink">{r.name}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-medium">{r.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

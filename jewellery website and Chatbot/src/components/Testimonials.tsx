import { Quote } from "lucide-react";

const reviews = [
  { name: "Ananya R.", role: "Bride, 2024", text: "The bridal set was a dream — every artisan detail showed. The expert consultation made choosing effortless." },
  { name: "Vikram & Priya", role: "Anniversary", text: "We've been clients for a decade. The craftsmanship and trust they've built is simply unmatched in Hyderabad." },
  { name: "Sneha K.", role: "Diamond Connoisseur", text: "Certified, transparent, and exquisite. The solitaire I purchased exceeded every expectation I had set." },
];

export function Testimonials() {
  return (
    <section className="bg-cream px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-gold">— Patron Stories</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl">In their words</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <figure
              key={r.name}
              className="luxury-shadow flex flex-col gap-6 rounded-sm border border-border/60 bg-card p-8 md:p-10"
            >
              <Quote className="h-7 w-7 text-gold" />
              <blockquote className="font-display text-lg leading-relaxed text-ink md:text-xl">
                "{r.text}"
              </blockquote>
              <figcaption className="mt-auto">
                <div className="gold-divider mb-4 w-12" />
                <p className="text-sm font-medium text-ink">{r.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{r.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

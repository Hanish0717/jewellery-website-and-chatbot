import { ShieldCheck, Gem, Hammer, Users, Crown } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "BIS Hallmarked", desc: "Every gram, certified pure." },
  { icon: Gem, title: "Certified Diamonds", desc: "GIA & IGI graded, conflict-free." },
  {
    icon: Hammer,
    title: "Master Craftsmanship",
    desc: "Hand-finished by 4th-generation karigars.",
  },
  { icon: Users, title: "Trusted by Thousands", desc: "Over 25,000 families & counting." },
  { icon: Crown, title: "20+ Years Legacy", desc: "Two decades of heritage jewellery." },
];

export function WhyUs() {
  return (
    <section
      id="about"
      className="relative bg-ink px-6 py-24 text-white md:px-12 md:py-32 border-t border-gold/10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center md:mb-24">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">
            — The Aurum Promise
          </p>
          <h2 className="font-display text-4xl md:text-5xl tracking-wide">
            Crafted with <em className="text-gold not-italic font-light">integrity</em>
          </h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {items.map((it) => (
            <div
              key={it.title}
              className="group flex flex-col items-center bg-black/25 border border-gold/15 hover:border-gold/40 rounded-xl p-8 text-center transition-all duration-500 hover:shadow-[0_15px_35px_rgba(212,175,55,0.08)] hover:-translate-y-1.5"
            >
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/5 text-gold transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-ink shadow-sm group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <it.icon className="h-5 w-5 stroke-[1.5]" />
              </span>
              <h3 className="font-display text-lg text-white tracking-wide">{it.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-white/50 font-light">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

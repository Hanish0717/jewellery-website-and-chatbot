import { ShieldCheck, Gem, Hammer, Users, Crown } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "BIS Hallmarked", desc: "Every gram, certified pure." },
  { icon: Gem, title: "Certified Diamonds", desc: "GIA & IGI graded, conflict-free." },
  { icon: Hammer, title: "Master Craftsmanship", desc: "Hand-finished by 4th-generation karigars." },
  { icon: Users, title: "Trusted by Thousands", desc: "Over 25,000 families & counting." },
  { icon: Crown, title: "20+ Years Legacy", desc: "Two decades of heritage jewellery." },
];

export function WhyUs() {
  return (
    <section id="about" className="relative bg-ink px-5 py-24 text-white md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center md:mb-20">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-gold">— The Aurum Promise</p>
          <h2 className="font-display text-4xl md:text-5xl">
            Crafted with <em className="text-gold not-italic">integrity</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 md:grid-cols-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="group flex flex-col items-center bg-ink p-8 text-center transition-colors hover:bg-white/[0.03]"
            >
              <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 text-gold transition-all group-hover:border-gold group-hover:bg-gold group-hover:text-ink">
                <it.icon className="h-6 w-6" />
              </span>
              <h3 className="font-display text-lg text-white">{it.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

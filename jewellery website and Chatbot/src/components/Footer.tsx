import { Sparkles, Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink px-6 pt-24 pb-12 text-white/60 md:px-12 border-t border-gold/25">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4 lg:gap-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 transition-transform duration-500 group-hover:rotate-90">
                <Sparkles className="h-4 w-4 text-gold" />
              </span>
              <span className="font-display text-2xl text-white tracking-widest">
                Aurum <span className="text-gold font-light">Vault</span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-xs md:text-sm leading-relaxed text-white/45 font-light">
              A heritage atelier crafting heirloom gold and diamond jewellery since 2003, in
              the heart of Jubilee Hills, Hyderabad.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-semibold text-white">Explore</h4>
            <div className="gold-divider my-4 w-12 opacity-60" />
            <ul className="space-y-3.5 text-xs md:text-sm font-light">
              {[
                { name: "Collections", href: "#collections" },
                { name: "Bridal Pieces", href: "#bridal" },
                { name: "Signature Atelier", href: "#products" },
                { name: "Our Legacy", href: "#about" }
              ].map((l) => (
                <li key={l.name}>
                  <a href={l.href} className="hover:text-gold transition-colors duration-300 tracking-wide">{l.name}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-semibold text-white">Reach Us</h4>
            <div className="gold-divider my-4 w-12 opacity-60" />
            <p className="text-xs md:text-sm leading-relaxed font-light space-y-2 text-white/50">
              <span>Road No. 36, Jubilee Hills, Hyderabad</span><br />
              <span className="block mt-1 font-medium text-white/70">+91 98480 22200</span>
              <span className="block hover:text-gold transition-colors"><a href="mailto:hello@aurumvault.in">hello@aurumvault.in</a></span>
            </p>
            <div className="mt-6 flex gap-4">
              {[Instagram, Facebook, Youtube].map((I, i) => (
                <a 
                  key={i} 
                  href="#" 
                  aria-label={`Footer social link ${i}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 hover:border-gold hover:bg-gold hover:text-ink text-white/70 transition-all duration-300 active:scale-95"
                >
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="gold-divider mt-20 opacity-30" />
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-[10px] md:text-xs text-white/35 md:flex-row">
          <p>© {new Date().getFullYear()} Aurum Vault Atelier. All rights reserved.</p>
          <p className="tracking-[0.2em] uppercase font-light">Crafted with quiet luxury · Hyderabad, India</p>
        </div>
      </div>
    </footer>
  );
}

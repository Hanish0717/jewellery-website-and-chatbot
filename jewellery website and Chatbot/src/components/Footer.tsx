import { Sparkles, Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink px-5 pt-20 pb-8 text-white/70 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60">
                <Sparkles className="h-4 w-4 text-gold" />
              </span>
              <span className="font-display text-2xl text-white">
                Aurum <span className="text-gold">Vault</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              A heritage atelier crafting heirloom gold and diamond jewellery since 2003, in
              the heart of Hyderabad.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base text-white">Explore</h4>
            <div className="gold-divider my-4 w-10" />
            <ul className="space-y-3 text-sm">
              {["Collections", "Bridal", "Diamond Jewellery", "About"].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-gold">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-white">Reach Us</h4>
            <div className="gold-divider my-4 w-10" />
            <p className="text-sm leading-relaxed">
              Jubilee Hills, Hyderabad<br />
              +91 98480 22200<br />
              hello@aurumvault.in
            </p>
            <div className="mt-5 flex gap-3">
              {[Instagram, Facebook, Youtube].map((I, i) => (
                <a key={i} href="#" className="hover:text-gold"><I className="h-4 w-4" /></a>
              ))}
            </div>
          </div>
        </div>

        <div className="gold-divider mt-16" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-white/40 md:flex-row">
          <p>© {new Date().getFullYear()} Aurum Vault. All rights reserved.</p>
          <p className="tracking-wider">Crafted with care · Hyderabad, India</p>
        </div>
      </div>
    </footer>
  );
}

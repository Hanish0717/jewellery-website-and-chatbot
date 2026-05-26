import { MapPin, Phone, Clock, Instagram, Facebook, Twitter, Youtube } from "lucide-react";

export function Store() {
  return (
    <section id="contact" className="px-6 py-24 md:px-12 md:py-32 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center md:mb-24">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">— Visit Us</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl tracking-wide">The Hyderabad Atelier</h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-60" />
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:items-stretch lg:gap-12">
          {/* Map Frame */}
          <div className="relative h-80 overflow-hidden rounded-2xl border border-gold/25 shadow-lg md:h-auto min-h-[350px]">
            <iframe
              title="Aurum Vault Hyderabad"
              src="https://www.openstreetmap.org/export/embed.html?bbox=78.42%2C17.40%2C78.50%2C17.46&layer=mapnik"
              className="absolute inset-0 h-full w-full grayscale contrast-[1.1] brightness-[0.95]"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/30" />
            <div className="absolute inset-0 bg-gold/5 mix-blend-color pointer-events-none" />
          </div>

          {/* Info Details Box */}
          <div className="flex flex-col justify-center gap-8 rounded-2xl bg-cream/40 border border-gold/15 p-8 md:p-12 shadow-sm">
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-gold/90" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Showroom Address</p>
                <p className="mt-2 font-display text-lg text-ink leading-relaxed tracking-wide">
                  Plot No. 14, Road No. 36, <br />
                  Jubilee Hills, Hyderabad — 500033
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-gold/90" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Private Consultations</p>
                <p className="mt-2 text-base text-ink tracking-wide font-medium">+91 98480 22200</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-gold/90" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Working Hours</p>
                <p className="mt-2 text-base text-ink tracking-wide font-medium">Mon – Sun · 10:30 AM – 9:00 PM</p>
              </div>
            </div>

            <div className="gold-divider opacity-60" />

            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-4">Connect With Us</p>
              <div className="flex items-center gap-4">
                {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    aria-label={`Visit our social page ${i}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 text-ink bg-white transition-all duration-300 hover:border-gold hover:bg-ink hover:text-gold hover:scale-105 shadow-sm active:scale-95"
                  >
                    <Icon className="h-4.5 w-4.5 stroke-[1.5]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

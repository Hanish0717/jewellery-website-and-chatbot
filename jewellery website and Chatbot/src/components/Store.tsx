import { MapPin, Phone, Clock, Instagram, Facebook, Twitter, Youtube } from "lucide-react";

export function Store() {
  return (
    <section id="contact" className="px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center md:mb-16">
          <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-gold">— Visit Us</p>
          <h2 className="font-display text-4xl text-ink md:text-5xl">The Hyderabad Atelier</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:items-stretch">
          <div className="relative h-72 overflow-hidden rounded-sm border border-border md:h-auto">
            <iframe
              title="Aurum Vault Hyderabad"
              src="https://www.openstreetmap.org/export/embed.html?bbox=78.42%2C17.40%2C78.50%2C17.46&layer=mapnik"
              className="absolute inset-0 h-full w-full grayscale"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/30" />
          </div>

          <div className="flex flex-col justify-center gap-7 rounded-sm bg-cream p-8 md:p-12">
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Showroom</p>
                <p className="mt-1 font-display text-lg text-ink">
                  Plot No. 14, Road No. 36, <br />
                  Jubilee Hills, Hyderabad — 500033
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Contact</p>
                <p className="mt-1 text-base text-ink">+91 98480 22200</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-gold" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Hours</p>
                <p className="mt-1 text-base text-ink">Mon – Sun · 10:30 AM – 9:00 PM</p>
              </div>
            </div>

            <div className="gold-divider" />

            <div className="flex items-center gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-all hover:border-gold hover:bg-ink hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

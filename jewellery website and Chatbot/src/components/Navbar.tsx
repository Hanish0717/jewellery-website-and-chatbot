import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "Collections", href: "#collections" },
  { label: "Bridal", href: "#bridal" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar({ onOpenChat }: { onOpenChat: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? "glass border-b border-border/50 py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-10">
        <a href="#home" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60">
            <Sparkles className="h-4 w-4 text-gold" />
          </span>
          <span className={`font-display text-xl md:text-2xl tracking-wide ${scrolled ? "text-ink" : "text-white"}`}>
            Aurum<span className="text-gold">&nbsp;Vault</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-9">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative text-sm tracking-wide transition-colors hover:text-gold ${
                scrolled ? "text-ink/80" : "text-white/90"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <button
            onClick={onOpenChat}
            className="group inline-flex items-center gap-2 rounded-full border border-gold bg-gold/10 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-gold transition-all hover:bg-gold hover:text-ink"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Talk to Jewellery Expert
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`lg:hidden ${scrolled ? "text-ink" : "text-white"}`}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-500 ${
          open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="glass mx-5 mt-3 rounded-lg border border-border/60 p-6">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-ink/85 tracking-wide hover:text-gold"
              >
                {l.label}
              </a>
            ))}
            <div className="gold-divider my-2" />
            <button
              onClick={() => {
                setOpen(false);
                onOpenChat();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold"
            >
              <Sparkles className="h-3.5 w-3.5" /> Talk to Jewellery Expert
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

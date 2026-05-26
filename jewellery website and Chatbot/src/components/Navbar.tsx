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
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = ["home", "collections", "bridal", "about", "contact"];
    const elements = sectionIds.map((id) => document.getElementById(id));

    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -55% 0px", // Trigger when section is prominent in viewport
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      elements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-md border-b border-gold/10 py-2.5 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-10">
        <a href="#home" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 transition-transform duration-500 group-hover:rotate-90">
            <Sparkles className="h-4 w-4 text-gold" />
          </span>
          <span
            className={`font-display text-xl md:text-2xl tracking-widest transition-colors ${scrolled ? "text-ink" : "text-white"}`}
          >
            Aurum<span className="text-gold font-light">&nbsp;Vault</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-10">
          {links.map((l) => {
            const isActive = activeSection === l.href.substring(1);
            return (
              <a
                key={l.href}
                href={l.href}
                className={`nav-link-underline text-[10px] md:text-xs uppercase tracking-[0.25em] font-medium transition-colors hover:text-gold ${
                  isActive
                    ? "text-gold active font-semibold"
                    : scrolled
                      ? "text-ink/80"
                      : "text-white/90"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <button
            onClick={onOpenChat}
            className={`group inline-flex items-center gap-2.5 rounded-full border border-gold/70 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer ${
              scrolled
                ? "bg-ink text-gold border-ink hover:bg-gold hover:text-ink hover:border-gold shadow-sm"
                : "bg-gold/10 text-gold hover:bg-gold hover:text-ink shadow-md shadow-black/10"
            } hover:scale-[1.02]`}
          >
            <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            Talk to Jewellery Expert
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`lg:hidden p-2 rounded-full transition-colors cursor-pointer ${
            scrolled ? "text-ink hover:bg-ink/5" : "text-white hover:bg-white/10"
          }`}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-5 rounded-2xl glass-luxury border border-gold/15 p-6 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4">
            {links.map((l) => {
              const isActive = activeSection === l.href.substring(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`text-xs uppercase tracking-[0.25em] font-medium py-2 border-b border-gold/5 transition-colors ${
                    isActive ? "text-gold font-semibold" : "text-ink/80 hover:text-gold"
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
            <div className="gold-divider my-3 opacity-60" />
            <button
              onClick={() => {
                setOpen(false);
                onOpenChat();
              }}
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-5 py-4 text-[10px] uppercase tracking-[0.2em] font-semibold text-gold shadow-lg shadow-black/10 hover:bg-gold hover:text-ink transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Talk to Jewellery Expert
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

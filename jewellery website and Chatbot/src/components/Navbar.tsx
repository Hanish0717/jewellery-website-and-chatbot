import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

const links = [
  { label: "Home", href: "#home" },
  { label: "Collections", href: "#collections" },
  { label: "Bridal", href: "#bridal" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar({ 
  onOpenChat,
  storeSettings,
}: { 
  onOpenChat: () => void;
  storeSettings?: {
    gold22kRate: string;
    gold18kRate: string;
    promoText: string;
    promoActive: boolean;
  };
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [clientUser, setClientUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("atelier_client_user");
      if (stored) {
        try {
          setClientUser(JSON.parse(stored));
        } catch {
          setClientUser(null);
        }
      } else {
        setClientUser(null);
      }
    };
    checkUser();

    window.addEventListener("storage", checkUser);
    window.addEventListener("client-auth-change", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("client-auth-change", checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("atelier_client_user");
    window.dispatchEvent(new Event("client-auth-change"));
    toast.success("Logged out successfully");
  };

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

  const showPromoBar = storeSettings && (storeSettings.promoActive || storeSettings.gold22kRate || storeSettings.gold18kRate);

  return (
    <>
      {/* Dynamic Info & Rates Marquee Bar */}
      <div
        className={`fixed left-0 right-0 z-50 bg-ink border-b border-gold/10 text-gold flex items-center justify-between px-6 py-2 transition-all duration-500 ease-in-out select-none ${
          scrolled || !showPromoBar
            ? "-translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
        style={{ height: "36px", top: 0 }}
      >
        <div className="flex-1 overflow-hidden relative h-5 hidden md:flex items-center justify-start text-[9px] uppercase tracking-[0.2em] font-light">
          {storeSettings?.promoActive && storeSettings?.promoText && (
            <span className="animate-fade-in truncate">{storeSettings.promoText}</span>
          )}
        </div>
        
        {/* Mobile Promo view (centered) */}
        <div className="flex md:hidden flex-1 overflow-hidden relative h-5 items-center justify-center text-[8px] uppercase tracking-[0.15em] font-light text-center">
          {storeSettings?.promoActive && storeSettings?.promoText ? (
            <span className="truncate">{storeSettings.promoText.replace(/[✨🔔]/g, "").trim()}</span>
          ) : (
            <span className="text-gold/80">Aurum Vault · Jubilee Hills</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.18em] font-semibold border-l border-gold/15 pl-4 ml-4 flex-shrink-0">
          {storeSettings?.gold22kRate && (
            <span className="hidden sm:inline">
              Today's 22K Gold: <span className="text-white font-medium ml-1">{storeSettings.gold22kRate}/g</span>
            </span>
          )}
          {storeSettings?.gold18kRate && (
            <span className="hidden sm:inline">
              18K Gold: <span className="text-white font-medium ml-1">{storeSettings.gold18kRate}/g</span>
            </span>
          )}
          {/* Mobile minimal rates */}
          <span className="inline sm:hidden text-[8px]">
            Gold: <span className="text-white font-medium ml-1">{storeSettings.gold22kRate || "₹6.85k"}/g</span>
          </span>
        </div>
      </div>

      <header
        className={`fixed left-0 right-0 z-45 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? "top-0 bg-white/90 backdrop-blur-md border-b border-gold/15 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
            : showPromoBar
              ? "top-9 py-6 bg-transparent"
              : "top-0 py-6 bg-transparent"
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

        <div className="hidden lg:flex items-center gap-6">
          {clientUser ? (
            <div className="flex items-center gap-3 bg-gold/10 border border-gold/25 rounded-full px-4 py-2 text-[10px] uppercase tracking-wider text-gold font-semibold shadow-inner animate-fade-in">
              <span>✨ {clientUser.name}</span>
              <span className="text-white/30">|</span>
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-rose-400 hover:underline transition-colors uppercase cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/admin"
              className={`text-[10px] uppercase tracking-[0.25em] font-semibold transition-all hover:text-gold hover:scale-[1.03] cursor-pointer ${
                scrolled ? "text-ink/80" : "text-white/90"
              }`}
            >
              Admin Login
            </Link>
          )}
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
            {clientUser ? (
              <div className="flex flex-col gap-2 py-2 border-b border-gold/5 text-xs text-left">
                <p className="text-ink/80 font-medium">✨ Account: <span className="text-gold font-bold">{clientUser.name}</span></p>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-[10px] uppercase tracking-[0.2em] text-rose-400 font-bold hover:underline cursor-pointer"
                >
                  Logout Account
                </button>
              </div>
            ) : (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-[0.25em] font-medium py-2 border-b border-gold/5 text-gold hover:text-white transition-colors cursor-pointer"
              >
                Admin Login 🛡️
              </Link>
            )}
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
    </>
  );
}

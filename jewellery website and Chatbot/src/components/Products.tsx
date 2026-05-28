import { useState } from "react";
import { Sparkles, X, Bell, Phone, User, Check } from "lucide-react";
import productsData from "@/data/products.json";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { subscribePriceAlertFn, loginClientFn, submitLeadFn } from "@/db/serverFunctions";
import { toast } from "sonner";

// Import all product assets to compile correctly under Vite
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";
import catBridal from "@/assets/cat-bridal.jpg";
import catDiamond from "@/assets/cat-diamond.jpg";
import catEarrings from "@/assets/cat-earrings.jpg";
import catNecklace from "@/assets/cat-necklace.jpg";
import catWedding from "@/assets/cat-wedding.jpg";

const imageMap: Record<string, string> = {
  "p1.jpg": p1,
  "p2.jpg": p2,
  "p3.jpg": p3,
  "p4.jpg": p4,
  "p5.jpg": p5,
  "p6.jpg": p6,
  "p7.jpg": p7,
  "p8.jpg": p8,
  "cat-bridal.jpg": catBridal,
  "cat-diamond.jpg": catDiamond,
  "cat-earrings.jpg": catEarrings,
  "cat-necklace.jpg": catNecklace,
  "cat-wedding.jpg": catWedding,
};

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  craftsmanship: string;
  image: string;
  tags: string[];
  offerText?: string;
}

const filters = ["All", "Bridal", "Gold", "Diamond", "Earrings", "Wedding"];

const matchesFilter = (productCategory: string, filter: string) => {
  if (filter === "All") return true;
  if (filter === "Gold") return productCategory === "Gold Necklace";
  if (filter === "Wedding") return productCategory === "Wedding Collection";
  return productCategory === filter;
};

export function Products({
  products: dbProducts,
  onAskAi,
}: {
  products?: { id?: number | string; name: string; price: string; category: string; description: string; imageUrl: string }[];
  onAskAi: (name: string) => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Price Drop Alert States
  const [submitting, setSubmitting] = useState(false);
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberPhone, setSubscriberPhone] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberTelegram, setSubscriberTelegram] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<{ whatsapp: boolean; email: boolean; telegram: boolean }>({
    whatsapp: true,
    email: false,
    telegram: false,
  });
  const [alertProduct, setAlertProduct] = useState<Product | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Authentication States
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; phone: string; email?: string; telegram?: string } | null>(null);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");

  const openSubscribeModal = (product: Product) => {
    setAlertProduct(product);
    setSubscriptionSuccess(false);

    // Sync logged in user from local storage
    const stored = localStorage.getItem("atelier_client_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLoggedInUser(parsed);
        setSubscriberName(parsed.name);
        setSubscriberPhone(parsed.phone);
        setSubscriberEmail(parsed.email || "");
        setSubscriberTelegram(parsed.telegram || "");
        setSelectedChannels({
          whatsapp: true,
          email: !!parsed.email,
          telegram: !!parsed.telegram,
        });
      } catch {
        setLoggedInUser(null);
      }
    } else {
      setLoggedInUser(null);
      setSubscriberName("");
      setSubscriberPhone("");
      setSubscriberEmail("");
      setSubscriberTelegram("");
      setLoginEmail("");
      setSelectedChannels({
        whatsapp: true,
        email: false,
        telegram: false,
      });
    }
  };

  const handleAlertSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    let name = subscriberName;
    let phone = subscriberPhone;
    let email = subscriberEmail;
    let telegram = subscriberTelegram;
    let activeUser = loggedInUser;

    // 1. Authenticate if not logged in
    if (!activeUser) {
      setSubmitting(true);
      try {
        if (authTab === "login") {
          if (!loginEmail.trim()) {
            toast.error("Please enter your email to log in");
            setSubmitting(false);
            return;
          }
          const res = await loginClientFn({ data: { email: loginEmail } });
          if (res.success && res.client) {
            const user = {
              name: res.client.name,
              phone: res.client.phone,
              email: res.client.email || undefined,
              telegram: res.client.telegram || undefined,
            };
            localStorage.setItem("atelier_client_user", JSON.stringify(user));
            window.dispatchEvent(new Event("client-auth-change"));
            setLoggedInUser(user);
            activeUser = user;
            name = user.name;
            phone = user.phone;
            email = user.email || "";
            telegram = user.telegram || "";
            setSelectedChannels({
              whatsapp: true,
              email: !!user.email,
              telegram: !!user.telegram,
            });
            toast.success(`Welcome back, ${user.name}!`);
          } else {
            toast.error(res.message || "Account not found");
            setSubmitting(false);
            return;
          }
        } else {
          // Register Flow
          if (!subscriberName.trim()) {
            toast.error("Please enter your name");
            setSubmitting(false);
            return;
          }
          if (!subscriberPhone.trim()) {
            toast.error("Please enter your mobile number");
            setSubmitting(false);
            return;
          }
          const phoneRegex = /^[6-9]\d{9}$/;
          if (!phoneRegex.test(subscriberPhone.replace(/\s+/g, ""))) {
            toast.error("Please enter a valid 10-digit mobile number");
            setSubmitting(false);
            return;
          }
          if (!subscriberEmail.trim()) {
            toast.error("Please enter your email address (required to log in later)");
            setSubmitting(false);
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(subscriberEmail.trim())) {
            toast.error("Please enter a valid email address");
            setSubmitting(false);
            return;
          }
          if (selectedChannels.telegram && subscriberTelegram.trim()) {
            const tgRegex = /^-?\d+$/;
            if (!tgRegex.test(subscriberTelegram.trim())) {
              toast.error("Please enter a valid numeric Telegram Chat ID");
              setSubmitting(false);
              return;
            }
          }

          // Register client
          await submitLeadFn({
            data: {
              name: subscriberName,
              phone: subscriberPhone,
              email: subscriberEmail.trim(),
              telegram: subscriberTelegram.trim() || undefined,
            },
          });

          const user = {
            name: subscriberName,
            phone: subscriberPhone,
            email: subscriberEmail.trim(),
            telegram: subscriberTelegram.trim() || undefined,
          };
          localStorage.setItem("atelier_client_user", JSON.stringify(user));
          window.dispatchEvent(new Event("client-auth-change"));
          setLoggedInUser(user);
          activeUser = user;
          name = user.name;
          phone = user.phone;
          email = user.email || "";
          telegram = user.telegram || "";
          toast.success(`Account registered! Welcome, ${user.name}!`);
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        toast.error(err.message || "Failed to authenticate");
        setSubmitting(false);
        return;
      } finally {
        setSubmitting(false);
      }
    }

    // 2. Perform Subscription
    const activeChannels = Object.entries(selectedChannels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);

    if (activeChannels.length === 0) {
      toast.error("Please select at least one notification channel");
      return;
    }

    if (selectedChannels.email && !email.trim()) {
      toast.error("Email required for email notifications");
      return;
    }
    if (selectedChannels.telegram && !telegram.trim()) {
      toast.error("Telegram Chat ID required for Telegram notifications");
      return;
    }

    setSubmitting(true);
    try {
      let numericId: number | null = null;
      if (dbProducts) {
        const match = dbProducts.find(
          (dp) => String(dp.id) === String(alertProduct.id) || dp.name === alertProduct.name
        );
        if (match && match.id) {
          numericId = Number(match.id);
        }
      }
      if (numericId === null || isNaN(numericId)) {
        numericId = parseInt(alertProduct.id);
      }
      if (isNaN(numericId)) {
        numericId = 1;
      }

      await subscribePriceAlertFn({
        data: {
          name,
          phone,
          email: selectedChannels.email ? email.trim() : undefined,
          telegram: selectedChannels.telegram ? telegram.trim() : undefined,
          deliveryChannel: activeChannels.join(","),
          productId: numericId,
          productName: alertProduct.name,
        },
      });

      setSubscriptionSuccess(true);
      toast.success(`Alert registered for ${alertProduct.name}!`);
      setTimeout(() => {
        setAlertProduct(null);
        setSubscriptionSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error("[Products] Error subscribing to alerts:", err);
      toast.error("Subscription failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayProducts: Product[] =
    dbProducts && dbProducts.length > 0
      ? dbProducts.map((p) => {
          const filename = p.imageUrl ? p.imageUrl.split("/").pop() || "p1.jpg" : "p1.jpg";
          return {
            id: String(p.id || p.name),
            name: p.name,
            category: p.category,
            price: p.price,
            description: p.description,
            craftsmanship: "Exquisite hand-finished luxury, designed with meticulous attention to detail.",
            image: filename,
            tags: [p.category],
            offerText: p.offerText || undefined,
          };
        })
      : (productsData as Product[]);

  const filteredProducts = displayProducts.filter((p) =>
    matchesFilter(p.category, selectedFilter),
  );

  return (
    <section
      id="products"
      className="bg-cream/40 px-6 py-24 md:px-12 md:py-32 border-y border-gold/10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="mb-3 text-[10px] md:text-xs uppercase tracking-[0.35em] text-gold font-semibold">
            — Signature Atelier
          </p>
          <h2 className="font-display text-4xl text-ink md:text-5xl tracking-wide">
            Signature Pieces
          </h2>
          <div className="gold-divider mx-auto mt-6 w-24 opacity-80" />
        </div>

        {/* Luxury Pill-Style Filter Tabs */}
        <div className="mb-16 flex flex-wrap justify-center gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 cursor-pointer ${
                selectedFilter === filter
                  ? "bg-ink text-gold border border-gold/30 shadow-md scale-[1.02]"
                  : "bg-white/60 border border-gold/5 text-ink/75 hover:text-ink hover:border-gold/25 hover:bg-cream/50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => (
            <article
              key={p.id}
              className="group flex flex-col bg-white border border-gold/10 rounded-2xl p-5 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)] hover:-translate-y-2"
            >
              {/* Product Image Frame (Clickable) */}
              <div
                onClick={() => setSelectedProduct(p)}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-gold/5 cursor-pointer"
              >
                <img
                  src={imageMap[p.image] || p1}
                  alt={p.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 border border-gold/20 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink font-medium shadow-sm">
                  {p.category}
                </span>
                {p.offerText && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-gold to-amber-600 text-ink px-3 py-1 text-[9px] uppercase tracking-[0.18em] font-bold shadow-[0_4px_12px_rgba(212,175,55,0.35)] animate-pulse">
                    ✨ Offer
                  </span>
                )}
              </div>

              {/* Product Metadata & Actions */}
              <div className="mt-6 flex flex-col flex-1 justify-between">
                <div>
                  <h3
                    onClick={() => setSelectedProduct(p)}
                    className="font-display text-xl text-ink leading-snug tracking-wide cursor-pointer hover:text-gold transition-colors"
                  >
                    {p.name}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-muted-foreground font-light leading-relaxed min-h-[40px] line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="mt-5 pt-5 border-t border-gold/10 flex flex-col gap-4">
                  {p.offerText && (
                    <div className="rounded-lg bg-gold/5 border border-gold/25 p-2.5 text-[10px] text-ink font-medium leading-relaxed flex items-start gap-1.5 animate-fade-in">
                      <span className="text-gold">✨</span>
                      <span>{p.offerText}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Estimated Price
                    </span>
                    <span className="text-base md:text-lg font-semibold tracking-wide text-ink">
                      {p.price}
                    </span>
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => onAskAi(p.name)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/80 bg-transparent py-3 text-[9px] uppercase tracking-[0.16em] text-ink font-semibold transition-all duration-300 hover:bg-ink hover:text-gold active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3 text-gold" /> Ask AI
                    </button>
                    <button
                      onClick={() => openSubscribeModal(p)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-ink text-gold border border-gold/20 py-3 text-[9px] uppercase tracking-[0.16em] font-semibold transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Bell className="h-3 w-3 text-gold" /> Alert Me
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Luxury Product Detail Modal */}
      <Dialog
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden bg-white/95 border border-gold/20 p-0 md:rounded-2xl shadow-2xl glass-luxury w-[90vw] max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Column: Product Image */}
              <div className="relative aspect-square md:aspect-auto md:h-full min-h-[320px] bg-muted border-r border-gold/10">
                <img
                  src={imageMap[selectedProduct.image] || p1}
                  alt={selectedProduct.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 border border-gold/20 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-ink font-medium shadow-sm">
                  {selectedProduct.category}
                </span>
              </div>

              {/* Right Column: Dynamic Info Sheet */}
              <div className="flex flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">
                      Atelier Original
                    </span>
                    <span className="text-lg font-semibold tracking-wide text-ink">
                      {selectedProduct.price}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-2xl md:text-3xl text-ink leading-tight tracking-wide">
                    {selectedProduct.name}
                  </h3>

                  <div className="gold-divider my-4 opacity-50" />

                  <p className="text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  {selectedProduct.offerText && (
                    <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/35 animate-fade-in shadow-xs">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-gold font-bold mb-1 flex items-center gap-1.5">
                        <span>✨ Special Boutique Offer</span>
                      </p>
                      <p className="text-xs text-ink font-medium leading-relaxed">
                        {selectedProduct.offerText}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 p-4 rounded-xl bg-cream/40 border border-gold/10">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-gold font-semibold mb-2">
                      Master Craftsmanship
                    </p>
                    <p className="text-xs leading-relaxed text-ink/80 font-light">
                      {selectedProduct.craftsmanship}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-gold/10 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      onAskAi(selectedProduct.name);
                      setSelectedProduct(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-ink py-3 text-[10px] uppercase tracking-[0.22em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink hover:scale-[1.02] shadow-md border border-gold/20 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gold" /> Ask AI About This
                  </button>
                  <button
                    onClick={() => {
                      openSubscribeModal(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2.5 rounded-full border border-ink/80 bg-transparent py-3 text-[10px] uppercase tracking-[0.22em] text-ink font-semibold transition-all duration-300 hover:bg-ink hover:text-gold hover:scale-[1.02] shadow-sm cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5 text-gold" /> Get Price Alerts
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full inline-flex items-center justify-center py-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-medium hover:text-ink transition-colors cursor-pointer"
                  >
                    Return to Atelier
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Price Alert Subscription Modal */}
      <Dialog
        open={alertProduct !== null}
        onOpenChange={(open) => !open && setAlertProduct(null)}
      >
        <DialogContent className="max-w-md overflow-hidden bg-white/95 border border-gold/20 p-6 md:rounded-2xl shadow-2xl glass-luxury w-[90vw]">
          {alertProduct && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-gold/10">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gold animate-bounce" />
                  <span className="font-display text-lg text-ink tracking-wide">Price & Offer Alerts</span>
                </div>
                <button
                  onClick={() => setAlertProduct(null)}
                  className="text-muted-foreground hover:text-ink cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {subscriptionSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200 mb-4 animate-scale-in">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-xl text-ink">Alert Subscription Active!</h3>
                  <p className="mt-2 text-xs text-muted-foreground font-light leading-relaxed px-4">
                    Thank you, {subscriberName || loggedInUser?.name}. We have registered your request. You will receive automated notifications on your selected channels if the price of **{alertProduct.name}** drops. 🔔
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAlertSubscribe} className="mt-4 space-y-4 text-left">
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    Subscribe to receive instant automated notifications when the price drops or exclusive offers are released for the **{alertProduct.name}** (Current price: {alertProduct.price}).
                  </p>

                  {/* Channel Selection Checkboxes */}
                  <div className="space-y-2 p-3 bg-cream/30 border border-gold/10 rounded-xl animate-fade-in">
                    <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold">
                      Notify Me Via
                    </label>
                    <div className="flex flex-wrap gap-4 mt-1">
                      <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.whatsapp}
                          onChange={(e) => setSelectedChannels(prev => ({ ...prev, whatsapp: e.target.checked }))}
                          className="h-4 w-4 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                        />
                        <span>WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.email}
                          onChange={(e) => setSelectedChannels(prev => ({ ...prev, email: e.target.checked }))}
                          className="h-4 w-4 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                        />
                        <span>Email</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.telegram}
                          onChange={(e) => setSelectedChannels(prev => ({ ...prev, telegram: e.target.checked }))}
                          className="h-4 w-4 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                        />
                        <span>Telegram</span>
                      </label>
                    </div>
                  </div>

                  {loggedInUser ? (
                    /* LOGGED IN VIEW */
                    <div className="p-3.5 bg-gold/5 border border-gold/15 rounded-xl space-y-1 animate-fade-in text-xs">
                      <p className="text-muted-foreground font-light">Subscribing with your profile:</p>
                      <p className="font-semibold text-ink">✨ {loggedInUser.name}</p>
                      <p className="text-[10px] text-muted-foreground font-light">
                        {loggedInUser.phone} {loggedInUser.email ? `• ${loggedInUser.email}` : ""} {loggedInUser.telegram ? `• Telegram: ${loggedInUser.telegram}` : ""}
                      </p>
                    </div>
                  ) : (
                    /* NOT LOGGED IN AUTH VIEW (Tabs) */
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-2 border-b border-gold/10 pb-2">
                        <button
                          type="button"
                          onClick={() => setAuthTab("login")}
                          className={`py-2 text-[10px] uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                            authTab === "login" ? "border-gold text-gold" : "border-transparent text-muted-foreground"
                          }`}
                        >
                          Login with Email
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthTab("register")}
                          className={`py-2 text-[10px] uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                            authTab === "register" ? "border-gold text-gold" : "border-transparent text-muted-foreground"
                          }`}
                        >
                          New Registration
                        </button>
                      </div>

                      {authTab === "login" ? (
                        /* LOGIN FORM */
                        <div className="space-y-3 animate-fade-in">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold mb-1">
                              Your Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="E.g., name@domain.com"
                              className="w-full rounded-lg bg-cream/30 border border-gold/10 px-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                            />
                          </div>
                        </div>
                      ) : (
                        /* REGISTER FORM */
                        <div className="space-y-3 animate-fade-in">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold mb-1">
                              Your Full Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-gold/60" />
                              <input
                                type="text"
                                required
                                value={subscriberName}
                                onChange={(e) => setSubscriberName(e.target.value)}
                                placeholder="E.g., Rajesh Kumar"
                                className="w-full rounded-lg bg-cream/30 border border-gold/10 pl-9 pr-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold mb-1">
                              Mobile Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gold/60" />
                              <input
                                type="tel"
                                required
                                value={subscriberPhone}
                                onChange={(e) => setSubscriberPhone(e.target.value)}
                                placeholder="10-Digit Mobile Number"
                                className="w-full rounded-lg bg-cream/30 border border-gold/10 pl-9 pr-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold mb-1">
                              Email Address
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-gold/60 text-xs font-semibold">@</span>
                              <input
                                type="email"
                                required
                                value={subscriberEmail}
                                onChange={(e) => setSubscriberEmail(e.target.value)}
                                placeholder="E.g., name@domain.com"
                                className="w-full rounded-lg bg-cream/30 border border-gold/10 pl-9 pr-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                              />
                            </div>
                          </div>

                          {selectedChannels.telegram && (
                            <div className="animate-fade-in space-y-1">
                              <label className="block text-[10px] uppercase tracking-wider text-ink font-semibold mb-1">
                                Telegram Chat ID (Optional)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-gold/60 text-[9px] font-bold">ID</span>
                                <input
                                  type="text"
                                  value={subscriberTelegram}
                                  onChange={(e) => setSubscriberTelegram(e.target.value)}
                                  placeholder="E.g., 987654321"
                                  className="w-full rounded-lg bg-cream/30 border border-gold/10 pl-9 pr-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                />
                              </div>
                              <p className="text-[9px] text-muted-foreground font-light leading-normal bg-gold/5 p-2 rounded border border-gold/15">
                                💡 Search and send a message to <b>@userinfobot</b> or <b>@GetIDsBot</b> on Telegram to instantly get your numeric Chat ID.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-[10px] uppercase tracking-[0.2em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "Processing..." : loggedInUser ? "Activate 1-Click Alert" : authTab === "login" ? "Login & Activate" : "Register & Activate"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

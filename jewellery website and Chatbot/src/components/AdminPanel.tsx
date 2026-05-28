import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  Database,
  Bell,
  Phone,
  User,
  Smartphone,
  MessageSquare,
  Check,
  TrendingDown,
  Tag,
  X,
  Clock,
  Sparkles,
  Inbox,
} from "lucide-react";
import {
  getProductsFn,
  getLeadsFn,
  getPriceAlertsFn,
  getAutomatedMessagesFn,
  triggerPriceDropOrOfferFn,
  updateStoreSettingsFn,
  clearAllLogsFn,
} from "@/db/serverFunctions";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  telegram?: string | null;
  status: string;
  createdAt: string | Date;
}

interface PriceAlert {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  telegram?: string | null;
  productId: number;
  productName: string;
  active: boolean;
  deliveryChannel?: string | null;
  createdAt: string | Date;
}

interface Product {
  id: number | string;
  name: string;
  price: string;
  priceVal: number;
  category: string;
  description: string;
  imageUrl: string;
  offerText?: string | null;
}

interface AutomatedMessage {
  id: number;
  alertId: number | null;
  name: string;
  phone: string;
  email?: string | null;
  telegram?: string | null;
  productName: string;
  oldPrice: string | null;
  newPrice: string | null;
  message: string;
  type: string;
  createdAt: string | Date;
}

interface AdminPanelProps {
  initialData?: {
    dbProducts: Product[];
    storeSettings?: {
      gold22kRate: string;
      gold18kRate: string;
      promoText: string;
      promoActive: boolean;
    };
    leads: Lead[];
    alerts: PriceAlert[];
    dbMessages: AutomatedMessage[];
  };
}

export function AdminPanel({ initialData }: AdminPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"leads" | "alerts" | "products" | "messages" | "settings">("leads");
  
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // Data States
  const [leads, setLeads] = useState<Lead[]>(initialData?.leads || []);
  const [alerts, setAlerts] = useState<PriceAlert[]>(initialData?.alerts || []);
  const [products, setProducts] = useState<Product[]>(initialData?.dbProducts || []);
  const [dbMessages, setDbMessages] = useState<AutomatedMessage[]>(initialData?.dbMessages || []);
  const [loading, setLoading] = useState(false);

  // Store Settings States
  const [gold22k, setGold22k] = useState(initialData?.storeSettings?.gold22kRate || "₹ 6,850");
  const [gold18k, setGold18k] = useState(initialData?.storeSettings?.gold18kRate || "₹ 5,605");
  const [promoText, setPromoText] = useState(initialData?.storeSettings?.promoText || "");
  const [promoActive, setPromoActive] = useState(initialData?.storeSettings?.promoActive ?? true);      
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Price Drop Form States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [triggerType, setTriggerType] = useState<"price_drop" | "offer">("price_drop");
  const [newPriceStr, setNewPriceStr] = useState("");
  const [newPriceVal, setNewPriceVal] = useState("");
  const [offerText, setOfferText] = useState("");
  const [submittingTrigger, setSubmittingTrigger] = useState(false);

  // Simulated Mobile Phone States
  const [activePhoneSub, setActivePhoneSub] = useState<string>(""); // Selected phone number to visualize
  const [simulatedNotifications, setSimulatedNotifications] = useState<{ id: string; title: string; body: string; time: string; targetApp?: "whatsapp" | "email" | "telegram" }[]>([]);
  const [phoneUnlocked, setPhoneUnlocked] = useState(false);
  const [phoneActiveApp, setPhoneActiveApp] = useState<"whatsapp" | "email" | "telegram">("whatsapp");

  // Audio ping ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const phoneMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter messages for the simulated phone and reverse to show chronologically (oldest top, newest bottom)
  const phoneMessages = [...dbMessages].filter((m) => m.phone === activePhoneSub).reverse();

  // Auto-scroll simulated phone messages list to bottom
  useEffect(() => {
    if (phoneUnlocked && phoneMessagesEndRef.current) {
      phoneMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [phoneMessages, phoneUnlocked]);

  // Check auth on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem("atelier_admin_auth") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Sync states when initialData changes from router invalidate
  useEffect(() => {
    if (initialData) {
      setLeads(initialData.leads || []);
      setAlerts(initialData.alerts || []);
      setProducts(initialData.dbProducts || []);
      setDbMessages(initialData.dbMessages || []);
      if (initialData.storeSettings) {
        setGold22k(initialData.storeSettings.gold22kRate);
        setGold18k(initialData.storeSettings.gold18kRate);
        setPromoText(initialData.storeSettings.promoText);
        setPromoActive(initialData.storeSettings.promoActive);
      }
    }
  }, [initialData]);

  // Sync initial phone selection
  useEffect(() => {
    if (!activePhoneSub && alerts.length > 0) {
      setActivePhoneSub(alerts[0].phone);
    }
  }, [alerts, activePhoneSub]);

  // Auto-refresh polling (every 5 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh immediately on auth (silent)
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Play a premium boutique notification chime
  const playChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const now = ctx.currentTime;
      // High-end digital chime sound using two sine oscillators
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("Chime failed to play:", e);
    }
  };

  // Helper to open WhatsApp Click-to-Chat with pre-filled message (100% Free)
  const openWhatsAppChat = (phone: string, text: string) => {
    let cleanedPhone = phone.replace(/\s+/g, "").replace(/[-()]/g, "");
    if (/^[6-9]\d{9}$/.test(cleanedPhone)) {
      cleanedPhone = `91${cleanedPhone}`;
    }
    const url = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin" || passwordInput === "aurum2026") {
      sessionStorage.setItem("atelier_admin_auth", "true");
      setIsAuthenticated(true);
      setAuthError(false);
      toast.success("Atelier Vault unlocked successfully!");
      setTimeout(() => playChime(), 100);
    } else {
      setAuthError(true);
      toast.error("Access Denied: Invalid Passcode.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("atelier_admin_auth");
    setIsAuthenticated(false);
    setPasswordInput("");
    toast.info("Logged out of administrative portal.");
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [leadsData, alertsData, productsData, messagesData] = await Promise.all([
        getLeadsFn(),
        getPriceAlertsFn(),
        getProductsFn(),
        getAutomatedMessagesFn(),
      ]);
      setLeads(leadsData as Lead[]);
      setAlerts(alertsData as PriceAlert[]);
      setProducts(productsData as Product[]);
      setDbMessages(messagesData as AutomatedMessage[]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      if (!silent) toast.error("Failed to load automation data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleOpenForm = (product: Product) => {
    setSelectedProduct(product);
    setNewPriceStr(product.price);
    setNewPriceVal(String(product.priceVal));
    setOfferText("");
    setTriggerType("price_drop");
  };

  const handleNumericPriceChange = (valStr: string) => {
    setNewPriceVal(valStr);
    const num = Number(valStr);
    if (!isNaN(num) && num > 0) {
      // Auto-format as Indian Rupees (en-IN)
      const formatted = "₹ " + new Intl.NumberFormat("en-IN").format(num);
      setNewPriceStr(formatted);
    } else if (valStr === "") {
      setNewPriceStr("");
    }
  };

  const handleDisplayPriceChange = (strVal: string) => {
    setNewPriceStr(strVal);
    // Extract numbers from the string to get the raw value
    const clean = strVal.replace(/[^\d]/g, "");
    if (clean) {
      setNewPriceVal(clean);
    } else if (strVal === "") {
      setNewPriceVal("");
    }
  };

  const handleTriggerAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmittingTrigger(true);
    try {
      const prodId = Number(selectedProduct.id);
      
      const payload: any = {
        productId: prodId,
        type: triggerType,
      };

      if (triggerType === "price_drop") {
        if (!newPriceStr || !newPriceVal) {
          toast.error("Please enter both display and numeric prices");
          setSubmittingTrigger(false);
          return;
        }
        payload.newPrice = newPriceStr;
        payload.newPriceVal = Number(newPriceVal);
      } else {
        if (!offerText.trim()) {
          toast.error("Please enter offer details");
          setSubmittingTrigger(false);
          return;
        }
        payload.offerText = offerText;
      }

      // Execute trigger
      const res = await triggerPriceDropOrOfferFn({ data: payload });

      if (res.success) {
        toast.success(`Successfully updated product and sent ${res.notificationsSentCount} automated alerts!`);
        
        // Invalidate router so that new prices immediately refresh on the homepage
        router.invalidate();
        
        // Refresh dashboard tables
        fetchData();
        setSelectedProduct(null);

        // If messages were sent, push a simulation notification for the currently active phone
        if (res.sentMessages && res.sentMessages.length > 0) {
          // Play notification sound
          playChime();

          // Add simulated push notifications
          res.sentMessages.forEach((msg: any) => {
            // Set active phone to this subscriber to visualize immediately
            setActivePhoneSub(msg.phone);
            
            // Choose target app for visualization
            let targetApp: "whatsapp" | "email" | "telegram" = "whatsapp";
            if (msg.telegram) {
              targetApp = "telegram";
            } else if (msg.email) {
              targetApp = "email";
            }

            const newNotif = {
              id: Math.random().toString(36).substring(7),
              title: "Aurum Vault 🔔",
              body: msg.message.length > 60 ? msg.message.substring(0, 57) + "..." : msg.message,
              time: "Just Now",
              targetApp,
            };
            setSimulatedNotifications((prev) => [newNotif, ...prev]);
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to trigger alert automation");
    } finally {
      setSubmittingTrigger(false);
    }
  };

  // LOGIN GATE SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none font-sans text-white">
        {/* Luxury backdrop decoration */}
        <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-md border border-gold/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center relative z-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-gold/5 mb-6 text-gold animate-pulse">
            <Sparkles className="h-6 w-6 animate-spin-slow" />
          </span>

          <h2 className="font-display text-2xl text-center text-gold tracking-widest uppercase">
            Unlock Atelier Vault
          </h2>
          <p className="text-[9px] text-white/50 text-center tracking-[0.2em] font-light mt-1.5 uppercase">
            Administrative Access Control
          </p>
          <div className="w-16 h-px bg-gold/25 my-5" />

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div>
              <label className="block text-[9px] uppercase tracking-widest text-gold font-bold mb-1.5 text-center">
                Secure Passcode
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter passcode (e.g. admin)"
                className={`w-full rounded-lg bg-ink border px-4 py-3 text-xs text-white text-center outline-none tracking-wider font-light transition-all focus:border-gold focus:ring-1 focus:ring-gold/30 ${
                  authError ? "border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20" : "border-gold/25"
                }`}
              />
              {authError && (
                <p className="text-[10px] text-rose-400 mt-1 text-center font-light">
                  Passcode incorrect. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-gold py-3.5 text-[10px] uppercase tracking-[0.2em] font-bold text-ink transition-all hover:bg-gold/90 hover:scale-[1.02] shadow-lg shadow-gold/10 cursor-pointer"
            >
              Authenticate & Enter
            </button>
          </form>

          <a
            href="/"
            className="mt-8 text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
          >
            ← Return to Storefront
          </a>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN PANEL DASHBOARD
  return (
    <div className="min-h-screen bg-ink text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Glow decorator */}
      <div className="absolute top-0 right-0 h-[40%] w-[40%] rounded-full bg-gold/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[40%] w-[40%] rounded-full bg-gold/5 blur-[150px] pointer-events-none" />

      {/* Top Header */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-gold/15 px-6 py-4 flex items-center justify-between z-10 relative">
        <a href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/60">
            <Sparkles className="h-4 w-4 text-gold" />
          </span>
          <span className="font-display text-lg md:text-xl tracking-widest text-white">
            Aurum<span className="text-gold font-light">&nbsp;Vault</span>
            <span className="ml-3 rounded bg-gold/15 border border-gold/30 text-gold text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 font-bold font-sans">
              Admin Portal
            </span>
          </span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-[9px] uppercase tracking-[0.2em] text-white/70 hover:text-white transition-all border border-white/10 rounded-full px-4 py-2 hover:border-gold/40 flex items-center gap-1.5 cursor-pointer bg-white/5"
          >
            ← View Storefront
          </a>
          <button
            onClick={handleLogout}
            className="text-[9px] uppercase tracking-[0.2em] text-rose-400 hover:text-rose-300 transition-all border border-rose-500/25 rounded-full px-4 py-2 hover:bg-rose-500/10 cursor-pointer bg-rose-500/5"
          >
            Lock Portal
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative z-10">
        
        {/* Main Content (Left Side) */}
        <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto min-w-0">
          
          {/* Summary Dashboard Statistics widgets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-gold/15 bg-white/5 p-4 relative overflow-hidden">
              <p className="text-[9px] uppercase tracking-widest text-gold font-semibold">Captured Leads</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">{leads.length}</h4>
              <div className="absolute right-3 bottom-2 opacity-10"><User className="h-10 w-10 text-gold" /></div>
            </div>
            <div className="rounded-xl border border-gold/15 bg-white/5 p-4 relative overflow-hidden">
              <p className="text-[9px] uppercase tracking-widest text-gold font-semibold">Subscribers</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">{alerts.length}</h4>
              <div className="absolute right-3 bottom-2 opacity-10"><Bell className="h-10 w-10 text-gold" /></div>
            </div>
            <div className="rounded-xl border border-gold/15 bg-white/5 p-4 relative overflow-hidden">
              <p className="text-[9px] uppercase tracking-widest text-gold font-semibold">Sent Logs</p>
              <h4 className="text-2xl font-bold tracking-tight mt-1">{dbMessages.length}</h4>
              <div className="absolute right-3 bottom-2 opacity-10"><MessageSquare className="h-10 w-10 text-gold" /></div>
            </div>
            <div className="rounded-xl border border-gold/15 bg-white/5 p-4 relative overflow-hidden">
              <p className="text-[9px] uppercase tracking-widest text-gold font-semibold">22K / 18K Gold</p>
              <h4 className="text-xs font-semibold tracking-wider text-white/90 mt-2 truncate">
                {gold22k} / {gold18k}
              </h4>
              <div className="absolute right-3 bottom-2 opacity-10"><TrendingDown className="h-10 w-10 text-gold" /></div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
            <button
              onClick={() => setActiveTab("leads")}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeTab === "leads"
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Database className="inline-block h-3.5 w-3.5 mr-2 -mt-0.5" /> Collected Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Bell className="inline-block h-3.5 w-3.5 mr-2 -mt-0.5" /> Price Alert Subscriptions ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeTab === "products"
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <TrendingDown className="inline-block h-3.5 w-3.5 mr-2 -mt-0.5" /> Product Price Manager ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeTab === "messages"
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <MessageSquare className="inline-block h-3.5 w-3.5 mr-2 -mt-0.5" /> Sent Alert Log ({dbMessages.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`rounded-full px-5 py-2 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-gold text-ink"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings className="inline-block h-3.5 w-3.5 mr-2 -mt-0.5" /> Boutique Settings
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-white/50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent mb-2" />
                <p className="text-xs">Updating boutique logs...</p>
              </div>
            ) : (
              <>
                {/* Leads Tab */}
                {activeTab === "leads" && (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-gold text-[10px] uppercase tracking-wider font-semibold">
                          <th className="px-6 py-4">Client Name</th>
                          <th className="px-6 py-4">Phone Number</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Telegram ID</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Collected At</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      {leads.length === 0 ? (
                        <tbody>
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-white/40 text-xs">
                              <Inbox className="mx-auto h-8 w-8 mb-2 opacity-50" />
                              No leads collected from the chatbot yet.
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody className="divide-y divide-white/5">
                          {leads.map((l) => (
                            <tr key={l.id} className="hover:bg-white/5 text-xs">
                              <td className="px-6 py-4 font-medium flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-gold" /> {l.name}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                <Phone className="h-3.5 w-3.5 text-gold/60 mr-2 inline" /> {l.phone}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                {l.email || <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                {l.telegram || <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-6 py-4">
                                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[9px] uppercase tracking-wide">
                                  {l.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-white/60">
                                <Clock className="h-3.5 w-3.5 text-white/30 mr-2 inline" /> {new Date(l.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-3 items-center">
                                  <button
                                    onClick={() => setActivePhoneSub(l.phone)}
                                    className="text-[10px] uppercase tracking-wider text-gold hover:underline cursor-pointer"
                                  >
                                    View Phone
                                  </button>
                                  <button
                                    onClick={() => {
                                      const text = `Hi ${l.name}! Thank you for contacting Aurum Vault. How can we assist you today?`;
                                      openWhatsAppChat(l.phone, text);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                  >
                                    <MessageSquare className="h-3 w-3" /> WhatsApp
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                )}

                {/* Alerts Tab */}
                {activeTab === "alerts" && (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-gold text-[10px] uppercase tracking-wider font-semibold">
                          <th className="px-6 py-4">Subscriber</th>
                          <th className="px-6 py-4">Phone Number</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Telegram ID</th>
                          <th className="px-6 py-4">Channels</th>
                          <th className="px-6 py-4">Likely Product</th>
                          <th className="px-6 py-4">Subscribed On</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      {alerts.length === 0 ? (
                        <tbody>
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-white/40 text-xs">
                              <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                              No clients subscribed to product price alerts yet.
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody className="divide-y divide-white/5 text-xs">
                          {alerts.map((a) => (
                            <tr key={a.id} className="hover:bg-white/5">
                              <td className="px-6 py-4 font-medium flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-gold" /> {a.name}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                <Phone className="h-3.5 w-3.5 text-gold/60 mr-2 inline" /> {a.phone}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                {a.email || <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-6 py-4 text-white/80">
                                {a.telegram || <span className="text-white/20">—</span>}
                              </td>
                              <td className="px-6 py-4">
                                {a.deliveryChannel ? (
                                  <div className="flex flex-wrap gap-1">
                                    {a.deliveryChannel.split(",").map((c) => (
                                      <span key={c} className="rounded bg-gold/10 border border-gold/25 text-gold text-[8px] uppercase px-1 py-0.5">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-white/20">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-semibold text-gold/90">
                                ✨ {a.productName}
                              </td>
                              <td className="px-6 py-4 text-white/60">
                                {new Date(a.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-emerald-400 font-medium">Active</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-3 items-center">
                                  <button
                                    onClick={() => setActivePhoneSub(a.phone)}
                                    className="text-[10px] uppercase tracking-wider text-gold hover:underline cursor-pointer"
                                  >
                                    View Phone
                                  </button>
                                  <button
                                    onClick={() => {
                                      const text = `✨ Aurum Vault Alert: Dear ${a.name}, there is an update regarding your liked product "${a.productName}" at Aurum Vault. Visit our showroom or connect with us here!`;
                                      openWhatsAppChat(a.phone, text);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                  >
                                    <MessageSquare className="h-3 w-3" /> WhatsApp
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                )}

                {/* Product Price Drop Trigger Tab */}
                {activeTab === "products" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Products List */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-h-[500px] overflow-y-auto space-y-3">
                      <h3 className="text-xs uppercase tracking-wider text-gold font-bold mb-2">Select Product to Update</h3>
                      {products.map((p) => {
                        // Filter alert count for this product
                        const subCount = alerts.filter((a) => String(a.productName) === String(p.name)).length;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleOpenForm(p)}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/10 ${
                              selectedProduct?.id === p.id
                                ? "border-gold bg-gold/10"
                                : "border-white/5 bg-white/5"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-white/50 mt-0.5 truncate">
                                {p.category} • Current: {p.price}
                              </p>
                              {p.offerText && (
                                <p className="text-[9px] text-gold/80 italic mt-1 truncate">
                                  ✨ Active Offer: {p.offerText}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex items-center gap-3 flex-shrink-0">
                              {subCount > 0 && (
                                <span className="rounded bg-gold/20 border border-gold/45 text-gold text-[9px] px-1.5 py-0.5 font-bold">
                                  {subCount} Subscribed
                                </span>
                              )}
                              <span className="text-xs font-bold text-gold">{p.price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Alert Configuration Form */}
                    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                      {selectedProduct ? (
                        <form onSubmit={handleTriggerAlert} className="space-y-4">
                          <h3 className="text-sm font-display text-gold border-b border-white/10 pb-2">
                            Configure Notification: {selectedProduct.name}
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setTriggerType("price_drop")}
                              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all border cursor-pointer ${
                                triggerType === "price_drop"
                                  ? "bg-gold text-ink border-gold"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                              }`}
                            >
                              <TrendingDown className="h-4 w-4" /> Price Drop
                            </button>
                            <button
                              type="button"
                              onClick={() => setTriggerType("offer")}
                              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all border cursor-pointer ${
                                triggerType === "offer"
                                  ? "bg-gold text-ink border-gold"
                                  : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                              }`}
                            >
                              <Tag className="h-4 w-4" /> Special Offer
                            </button>
                          </div>

                          {triggerType === "price_drop" ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-1">
                                <p className="text-white/60">Current Price Display: <span className="text-white font-bold">{selectedProduct.price}</span></p>
                                <p className="text-white/60">Current Value: <span className="text-white font-bold">₹ {selectedProduct.priceVal.toLocaleString()}</span></p>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1">
                                  New Price (Display text)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newPriceStr}
                                  onChange={(e) => handleDisplayPriceChange(e.target.value)}
                                  placeholder="E.g., ₹ 1,80,000"
                                  className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1">
                                  New Price Value (Numeric)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={newPriceVal}
                                  onChange={(e) => handleNumericPriceChange(e.target.value)}
                                  placeholder="E.g., 180000"
                                  className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1">
                                Offer / Discount Details
                              </label>
                              <textarea
                                required
                                value={offerText}
                                onChange={(e) => setOfferText(e.target.value)}
                                placeholder="E.g., Flat 15% off making charges, valid until Sunday! Plus free jewellery care kit."
                                rows={4}
                                className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold font-light"
                              />
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submittingTrigger}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold py-3 text-xs uppercase tracking-wider font-semibold text-ink transition-all hover:bg-gold/90 disabled:opacity-50 cursor-pointer"
                          >
                            {submittingTrigger ? "Sending Alerts..." : "Trigger Updates & Send SMS"}
                          </button>
                        </form>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-xl text-white/30 text-xs text-center p-4">
                          <TrendingDown className="h-10 w-10 mb-2 text-gold/30 animate-pulse" />
                          <p>Select a product from the list to trigger a price drop or offer notification.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Log Tab */}
                {activeTab === "messages" && (
                  <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 max-h-[500px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-gold text-[10px] uppercase tracking-wider font-semibold">
                          <th className="px-6 py-4">Recipient</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Telegram ID</th>
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4">Trigger</th>
                          <th className="px-6 py-4">Alert Message</th>
                          <th className="px-6 py-4">Sent Time</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      {dbMessages.length === 0 ? (
                        <tbody>
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-white/40 text-xs">
                              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                              No alerts logged in the gateway database yet.
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody className="divide-y divide-white/5 text-xs">
                          {dbMessages.map((m) => (
                            <tr key={m.id} className="hover:bg-white/5">
                              <td className="px-6 py-3 font-semibold">{m.name}</td>
                              <td className="px-6 py-3 text-white/70">{m.phone}</td>
                              <td className="px-6 py-3 text-white/70">{m.email || <span className="text-white/20">—</span>}</td>
                              <td className="px-6 py-3 text-white/70">{m.telegram || <span className="text-white/20">—</span>}</td>
                              <td className="px-6 py-3 text-gold/80 font-medium">{m.productName}</td>
                              <td className="px-6 py-3">
                                <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-semibold ${
                                  m.type === "price_drop" 
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                }`}>
                                  {m.type === "price_drop" ? "Price Drop" : "Offer"}
                                </span>
                              </td>
                              <td className="px-6 py-3 max-w-[200px] truncate text-white/80 font-light" title={m.message}>
                                {m.message}
                              </td>
                              <td className="px-6 py-3 text-white/50">{new Date(m.createdAt).toLocaleTimeString()}</td>
                              <td className="px-6 py-3 text-right">
                                <button
                                  onClick={() => openWhatsAppChat(m.phone, m.message)}
                                  className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500 hover:text-ink font-semibold transition-all cursor-pointer"
                                >
                                  <MessageSquare className="h-3 w-3" /> Send WhatsApp (Free)
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      )}
                    </table>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="max-w-2xl rounded-xl border border-white/10 bg-white/5 p-6 animate-fade-in">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setUpdatingSettings(true);
                        try {
                          const res = await updateStoreSettingsFn({
                            data: {
                              gold22kRate: gold22k,
                              gold18kRate: gold18k,
                              promoText: promoText,
                              promoActive: promoActive,
                            },
                          });
                          if (res.success) {
                            toast.success("Boutique settings updated successfully!");
                            router.invalidate();
                          }
                        } catch (err: any) {
                          console.error(err);
                          toast.error(err.message || "Failed to save settings");
                        } finally {
                          setTimeout(() => setUpdatingSettings(false), 200);
                        }
                      }}
                      className="space-y-6"
                    >
                      <h3 className="text-sm font-display text-gold border-b border-white/10 pb-2">
                        Boutique Rates & Banner Configurator
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1.5">
                            Today's 22K Gold Rate (per gram)
                          </label>
                          <input
                            type="text"
                            required
                            value={gold22k}
                            onChange={(e) => setGold22k(e.target.value)}
                            placeholder="E.g., ₹ 6,850"
                            className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1.5">
                            Today's 18K Gold Rate (per gram)
                          </label>
                          <input
                            type="text"
                            required
                            value={gold18k}
                            onChange={(e) => setGold18k(e.target.value)}
                            placeholder="E.g., ₹ 5,605"
                            className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1.5">
                          Live Promotional Banner Text
                        </label>
                        <input
                          type="text"
                          required
                          value={promoText}
                          onChange={(e) => setPromoText(e.target.value)}
                          placeholder="E.g., ✨ Special Festive Offer: 25% Off Making Charges! ✨"
                          className="w-full rounded-lg bg-ink border border-gold/20 px-3 py-2 text-xs text-white outline-none focus:border-gold font-light"
                        />
                      </div>

                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-lg">
                        <input
                          type="checkbox"
                          id="promoActive"
                          checked={promoActive}
                          onChange={(e) => setPromoActive(e.target.checked)}
                          className="h-4 w-4 rounded border-gold/25 text-gold bg-ink focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="promoActive" className="text-xs text-white/80 select-none cursor-pointer">
                          Enable Live Promotional Header Banner on the Storefront
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={updatingSettings}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-3 text-xs uppercase tracking-wider font-semibold text-ink transition-all hover:bg-gold/90 disabled:opacity-50 cursor-pointer"
                        >
                          {updatingSettings ? "Saving Settings..." : "Save Boutique Configurations"}
                        </button>
                      </div>
                    </form>

                    <div className="border-t border-white/10 mt-8 pt-6">
                      <h4 className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-2">
                        Database Maintenance
                      </h4>
                      <p className="text-[11px] text-white/60 mb-4 leading-relaxed font-light">
                        Clear all customer leads, active price drop alerts, and automated broadcast message logs from the database to start testing with a clean, fresh slate. This operation is permanent and cannot be undone.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("⚠️ WARNING: This will permanently delete all customer leads, alert subscriptions, and message logs. Are you sure you want to proceed and start fresh?")) {
                            try {
                              const res = await clearAllLogsFn();
                              if (res.success) {
                                toast.success(res.message);
                                fetchData(true);
                              }
                            } catch (err: any) {
                              toast.error(err.message || "Failed to clear database logs");
                            }
                          }
                        }}
                        className="rounded-lg bg-rose-500/10 border border-rose-500/25 px-6 py-2.5 text-xs uppercase tracking-wider font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        Clear Customer Data & Start Fresh
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* SIMULATED PHONE VISUALIZER (Right Side) */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-black/40 border-t lg:border-t-0 lg:border-l border-gold/10 p-6 md:p-8 flex flex-col items-center justify-start flex-shrink-0 overflow-y-auto">
          
          {/* Phone Frame */}
          <div className="relative w-[280px] h-[550px] rounded-[38px] bg-[#1a1a1a] p-3 border-4 border-[#333] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden ring-12 ring-black">
            
            {/* Dynamic Island / Speaker Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-20 rounded-full bg-black z-20 flex items-center justify-end px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
            </div>

            {/* Screen Container */}
            <div className="relative flex-1 w-full h-full rounded-[28px] bg-zinc-950 overflow-hidden flex flex-col font-sans select-none">
              
              {/* Status Bar */}
              <div className="h-8 px-5 pt-2 flex items-center justify-between text-[10px] text-white font-medium z-10">
                <span>10:30</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <div className="h-3 w-5 border border-white/50 rounded-sm p-0.5 flex items-center">
                    <div className="h-full w-full bg-white rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Simulated Push Notification Banner */}
              {simulatedNotifications.length > 0 && (
                <div 
                  onClick={() => {
                    setPhoneUnlocked(true);
                    const target = simulatedNotifications[0].targetApp || "whatsapp";
                    setPhoneActiveApp(target);
                    setSimulatedNotifications([]);
                  }}
                  className="absolute top-9 left-2.5 right-2.5 bg-black/85 backdrop-blur-md rounded-2xl border border-white/10 p-3 shadow-lg z-30 animate-fade-down flex items-start gap-2.5 cursor-pointer hover:bg-black"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/40">
                    <Bell className="h-3.5 w-3.5 text-gold" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Aurum Vault</span>
                      <span className="text-[9px] text-white/50">now</span>
                    </div>
                    <p className="text-[10px] text-white font-medium mt-0.5 leading-tight line-clamp-2">
                      {simulatedNotifications[0].body}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSimulatedNotifications([]);
                    }}
                    className="text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Screen Content */}
              {!phoneUnlocked ? (
                /* LOCK SCREEN */
                <div 
                  onClick={() => setPhoneUnlocked(true)}
                  className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-purple-950/20 via-zinc-950 to-amber-950/20 text-center cursor-pointer"
                >
                  <div className="mt-8">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-white/60">Tuesday, May 26</p>
                    <h1 className="text-4xl font-light text-white tracking-wide mt-1">10:30</h1>
                  </div>

                  <div className="space-y-4">
                    {simulatedNotifications.length > 0 && (
                      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 text-left text-xs animate-pulse">
                        <p className="text-[10px] font-semibold text-gold uppercase tracking-wider mb-1">New Message Alert</p>
                        <p className="text-[11px] text-white/90 line-clamp-2">{simulatedNotifications[0].body}</p>
                      </div>
                    )}
                    
                    <div className="text-[10px] text-white/40 tracking-wider">
                      — Swipe up or Click to Unlock —
                    </div>
                  </div>
                </div>
              ) : (
                /* UNLOCKED SCREEN SWITCHER */
                <div className="flex-1 flex flex-col bg-zinc-900 text-white min-h-0">
                  {/* APP 1: WHATSAPP */}
                  {phoneActiveApp === "whatsapp" && (
                    <div className="flex-1 flex flex-col bg-zinc-900 text-white min-h-0">
                      {/* App Header */}
                      <div className="bg-zinc-950 px-4 py-3 flex items-center gap-3 border-b border-white/5">
                        <button 
                          onClick={() => setPhoneUnlocked(false)}
                          className="text-xs text-gold font-light hover:underline cursor-pointer"
                        >
                          Lock
                        </button>
                        <div className="flex-1 text-center">
                          <p className="text-[11px] font-bold tracking-wide">Aurum Vault Alerts</p>
                          <p className="text-[9px] text-emerald-400 font-light mt-0.5">Verified Business Account</p>
                        </div>
                        <div className="w-8" />
                      </div>

                      {/* Messages Body */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col justify-end">
                        {phoneMessages.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-white/30 text-[10px]">
                            <Inbox className="h-6 w-6 mb-1 text-white/20" />
                            <p>No WhatsApp alerts received.</p>
                            <p className="mt-1 text-[9px] text-white/20">Trigger a price drop or offer alert to see notifications here.</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1" />
                            {phoneMessages.map((msg) => (
                              <div 
                                key={msg.id}
                                className="bg-zinc-800 text-white rounded-2xl rounded-tl-none border border-zinc-700/55 p-3 text-[11px] leading-relaxed max-w-[90%] shadow-sm self-start animate-scale-in"
                              >
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-[8px] text-white/40 text-right mt-1.5">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                            <div ref={phoneMessagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* App Input Footer */}
                      <div className="bg-zinc-950 p-2 border-t border-white/5 flex gap-2 items-center">
                        <div className="flex-1 bg-zinc-800 rounded-full px-3 py-1.5 text-[10px] text-white/50 border border-zinc-700/30">
                          Chat locked to broadcast alerts
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APP 2: EMAIL */}
                  {phoneActiveApp === "email" && (
                    <div className="flex-1 flex flex-col bg-zinc-950 text-white min-h-0">
                      {/* App Header */}
                      <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-white/10">
                        <button 
                          onClick={() => setPhoneUnlocked(false)}
                          className="text-[10px] text-gold uppercase tracking-wider font-semibold hover:underline cursor-pointer"
                        >
                          Lock
                        </button>
                        <span className="text-[11px] font-semibold tracking-wide text-white">Mail Client</span>
                        <div className="w-8" />
                      </div>

                      {/* Email List/Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        {phoneMessages.filter(m => m.email).length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/30 text-[10px]">
                            <Inbox className="h-6 w-6 mb-1 text-white/20" />
                            <p>No emails received yet.</p>
                            <p className="mt-1 text-[9px] text-white/20">Subscribe with Email and trigger an alert.</p>
                          </div>
                        ) : (
                          phoneMessages.filter(m => m.email).map((msg) => (
                            <div key={msg.id} className="bg-[#121212] border border-[#c5a880] rounded-xl p-3.5 shadow-lg space-y-2.5 animate-scale-in text-[10px] text-[#e5e5e5] font-light">
                              <div className="border-b border-white/5 pb-2 text-[9px] text-white/60 space-y-0.5 font-sans">
                                <p><span className="text-gold font-medium">From:</span> Aurum Vault &lt;alerts@aurumvault.com&gt;</p>
                                <p><span className="text-gold font-medium">To:</span> {msg.email}</p>
                                <p><span className="text-gold font-medium">Subject:</span> {msg.type === "price_drop" ? "✨ Price Drop Alert" : "✨ Special Boutique Offer"}</p>
                              </div>
                              
                              <div className="py-2 text-center bg-[#1f1a14]/50 border border-gold/15 rounded-lg font-sans">
                                <h2 className="font-serif text-[12px] text-gold uppercase tracking-widest">Aurum Vault</h2>
                                <p className="text-[7px] text-gold/60 uppercase tracking-widest">Luxury Atelier & Boutique</p>
                              </div>

                              <p className="font-serif text-gold text-[11px]">Greetings, {msg.name}</p>
                              <p className="leading-relaxed font-sans">{msg.message}</p>
                              
                              <div className="text-center pt-1.5 font-sans">
                                <span className="inline-block bg-gradient-to-r from-gold to-amber-600 text-ink font-bold uppercase tracking-wider text-[8px] px-4 py-1.5 rounded shadow-md">
                                  View Collection
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP 3: TELEGRAM */}
                  {phoneActiveApp === "telegram" && (
                    <div className="flex-1 flex flex-col bg-[#0e1621] text-white min-h-0">
                      {/* Telegram Header */}
                      <div className="bg-[#17212b] px-4 py-2.5 flex items-center justify-between border-b border-[#101921]">
                        <button 
                          onClick={() => setPhoneUnlocked(false)}
                          className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold hover:underline cursor-pointer"
                        >
                          Lock
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-white">Aurum Vault Bot</span>
                          <span className="text-[8px] text-sky-400">bot</span>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold text-[9px] font-bold">
                          AV
                        </div>
                      </div>

                      {/* Messages Body */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 flex flex-col justify-end">
                        {phoneMessages.filter(m => m.telegram).length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-white/30 text-[10px]">
                            <Smartphone className="h-6 w-6 mb-1 text-white/20" />
                            <p>No Telegram alerts received.</p>
                            <p className="mt-1 text-[9px] text-white/20">Subscribe with Telegram Chat ID and trigger alerts.</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1" />
                            {phoneMessages.filter(m => m.telegram).map((msg) => (
                              <div 
                                key={msg.id}
                                className="bg-[#182533] text-white rounded-xl rounded-tl-none border border-[#203040] p-3 text-[11px] leading-relaxed max-w-[85%] shadow-sm self-start animate-scale-in"
                              >
                                <p className="font-bold text-sky-400 text-[9px] mb-1">Aurum Vault Bot</p>
                                <div 
                                  className="whitespace-pre-wrap font-sans"
                                  dangerouslySetInnerHTML={{
                                    __html: `<b>${msg.type === 'price_drop' ? '✨ Price Drop Alert ✨' : '✨ Special Offer ✨'}</b>\n\nDear ${msg.name},\n\n${msg.message}\n\n<i>Aurum Vault Concierge</i>`
                                  }}
                                />
                                <p className="text-[7px] text-white/40 text-right mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                            <div ref={phoneMessagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Input Footer */}
                      <div className="bg-[#17212b] p-2 border-t border-[#101921] text-center text-[9px] text-white/30">
                        Bot chats are read-only
                      </div>
                    </div>
                  )}

                  {/* Smartphone App Dock at Bottom */}
                  <div className="bg-zinc-950 p-2 border-t border-white/10 flex justify-around items-center">
                    <button
                      onClick={() => setPhoneActiveApp("whatsapp")}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        phoneActiveApp === "whatsapp" ? "text-emerald-400 scale-110" : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span className="text-[8px] uppercase tracking-wider font-semibold">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setPhoneActiveApp("email")}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        phoneActiveApp === "email" ? "text-gold scale-110" : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <Inbox className="h-4.5 w-4.5" />
                      <span className="text-[8px] uppercase tracking-wider font-semibold">Email</span>
                    </button>
                    <button
                      onClick={() => setPhoneActiveApp("telegram")}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        phoneActiveApp === "telegram" ? "text-sky-400 scale-110" : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      <Smartphone className="h-4.5 w-4.5" />
                      <span className="text-[8px] uppercase tracking-wider font-semibold">Telegram</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscriber Switcher */}
          <div className="mt-6 w-[280px] bg-white/5 border border-white/10 rounded-xl p-3 flex-shrink-0">
            <label className="block text-[10px] uppercase tracking-wider text-gold font-bold mb-1.5 text-center">
              Select Active Device SIM
            </label>
            <select
              value={activePhoneSub}
              onChange={(e) => {
                setActivePhoneSub(e.target.value);
                setPhoneUnlocked(true);
              }}
              className="w-full rounded-lg bg-zinc-900 border border-gold/20 px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
            >
              {alerts.length === 0 ? (
                <option value="">No Active Subscribers</option>
              ) : (
                Array.from(new Set(alerts.map((a) => JSON.stringify({ name: a.name, phone: a.phone })))).map((strSub) => {
                  const sub = JSON.parse(strSub);
                  return (
                    <option key={sub.phone} value={sub.phone}>
                      {sub.name} ({sub.phone})
                    </option>
                  );
                })
              )}
            </select>
          </div>
          
        </div>
      </div>
    </div>
  );
}

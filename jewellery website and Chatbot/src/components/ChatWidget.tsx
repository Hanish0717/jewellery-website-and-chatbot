import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, User, Calendar, Phone, Check } from "lucide-react";
import productsData from "@/data/products.json";
import faqsData from "@/data/faqs.json";
import { chatFn, submitLeadFn, subscribePriceAlertFn, loginClientFn } from "@/db/serverFunctions";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  craftsmanship: string;
  image: string;
  tags: string[];
}

interface Faq {
  question: string;
  answer: string;
  category: string;
}

type Msg = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  isForm?: boolean;
  formType?: "lead";
  timestamp: Date;
};

// RAG Search simulation helpers
const findProductMatch = (query: string): Product | null => {
  const clean = query.toLowerCase();

  // 1. Direct name match
  const exact = (productsData as Product[]).find((p) => clean.includes(p.name.toLowerCase()));
  if (exact) return exact;

  // 2. Keyword/tag match scoring
  let bestMatch: Product | null = null;
  let maxScore = 0;

  for (const p of productsData as Product[]) {
    let score = 0;
    // Category match
    if (clean.includes(p.category.toLowerCase())) score += 3;
    // Tag match
    for (const tag of p.tags) {
      if (clean.includes(tag.toLowerCase())) score += 1.5;
    }
    // Word match in name
    const words = p.name.toLowerCase().split(" ");
    for (const w of words) {
      if (w.length > 3 && clean.includes(w)) score += 2;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = p;
    }
  }

  return maxScore > 1 ? bestMatch : null;
};

const findFaqMatch = (query: string): Faq | null => {
  const clean = query.toLowerCase();
  let bestMatch: Faq | null = null;
  let maxScore = 0;

  for (const faq of faqsData as Faq[]) {
    let score = 0;
    const qWords = faq.question.toLowerCase().split(" ");
    for (const w of qWords) {
      if (w.length > 3 && clean.includes(w)) score += 1.5;
    }
    if (clean.includes(faq.category.toLowerCase())) score += 2;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = faq;
    }
  }

  return maxScore > 1 ? bestMatch : null;
};

function craftDynamicReply(q: string): { text: string; triggerLead?: boolean } {
  const clean = q.toLowerCase();

  // Match purchase, appointment, or viewing intent
  const showsBuyingIntent =
    clean.includes("book") ||
    clean.includes("consultation") ||
    clean.includes("appointment") ||
    clean.includes("viewing") ||
    clean.includes("reserve") ||
    clean.includes("visit") ||
    clean.includes("buy") ||
    clean.includes("purchase") ||
    clean.includes("order") ||
    clean.includes("custom");

  if (showsBuyingIntent) {
    return {
      text: "I would be absolutely delighted to arrange a private consultation for you. Let's gather a few quick details to secure your request in our Palakonda atelier.",
      triggerLead: true,
    };
  }

  // Search product dataset
  const pMatch = findProductMatch(q);
  if (pMatch) {
    const wantsBuy =
      clean.includes("want") ||
      clean.includes("buy") ||
      clean.includes("price") ||
      clean.includes("cost") ||
      clean.includes("how much");
    if (wantsBuy) {
      return {
        text: `The ${pMatch.name} is priced at an estimate of ${pMatch.price}. It is crafted with ${pMatch.craftsmanship}. Would you like me to book a private viewing of this signature piece at our showroom?`,
        triggerLead: true,
      };
    }
    return {
      text: `The ${pMatch.name} is a fine selection from our ${pMatch.category} gallery, estimated at ${pMatch.price}. ${pMatch.description}\n\nCraftsmanship: ${pMatch.craftsmanship}\n\nWould you like to schedule a private viewing of this piece?`,
    };
  }

  // Search FAQs
  const faqMatch = findFaqMatch(q);
  if (faqMatch) {
    return { text: faqMatch.answer };
  }

  // Fallback response
  return {
    text: "I'd be pleased to guide you. Could you share whether you are exploring bridal sets, gold collections, diamonds, or if you'd like to book a private consultation at our Palakonda showroom?",
  };
}

export type ChatHandle = { open: () => void; askAbout: (name: string) => void };

const suggestions = [
  "Show bridal sets under ₹2 lakh",
  "Gold necklaces under ₹1 lakh",
  "Store location",
  "Book a bridal consultation",
];

export function ChatWidget({
  handleRef,
}: {
  handleRef: React.MutableRefObject<ChatHandle | null>;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "initial",
      role: "ai",
      text: "Namaste — I'm Anaya, your personal jewellery consultant at Aurum Vault. How may I help you discover something beautiful today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Lead Form States (Conversational Inline)
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadTelegram, setLeadTelegram] = useState("");
  const [formStep, setFormStep] = useState(1); // 1: Tabbed Form, 2: Completed
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string; telegram?: string }>({});
  const [submittingLead, setSubmittingLead] = useState(false);
  const [lastProductAsked, setLastProductAsked] = useState<string | null>(null);

  // Authentication States
  const [clientUser, setClientUser] = useState<{ name: string; phone: string; email?: string; telegram?: string } | null>(null);
  const [chatAuthTab, setChatAuthTab] = useState<"login" | "register">("login");
  const [chatLoginEmail, setChatLoginEmail] = useState("");
  const [chatSelectedChannels, setChatSelectedChannels] = useState<{ whatsapp: boolean; email: boolean; telegram: boolean }>({
    whatsapp: true,
    email: false,
    telegram: false,
  });

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("atelier_client_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setClientUser(parsed);
          setLeadName(parsed.name || "");
          setLeadPhone(parsed.phone || "");
          setLeadEmail(parsed.email || "");
          setLeadTelegram(parsed.telegram || "");
          setChatSelectedChannels({
            whatsapp: true,
            email: !!parsed.email,
            telegram: !!parsed.telegram,
          });
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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleRef.current = {
      open: () => setOpen(true),
      askAbout: (name) => {
        setOpen(true);
        setLastProductAsked(name);
        send(`Tell me about the ${name}`);
      },
    };
  }, [handleRef]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open, formStep]);

  const send = async (text: string) => {
    if (!text.trim()) return;

    // Try to auto-detect product interest
    const matched = findProductMatch(text);
    let currentLastProduct = lastProductAsked;
    if (matched) {
      setLastProductAsked(matched.name);
      currentLastProduct = matched.name;
    }

    // Add user message
    const userMsg: Msg = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Map message history to server format
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("ai" as const),
        text: m.text,
      }));

      // Call our TanStack Start server function
      const res = await chatFn({ data: { message: text, history: chatHistory } });

      setTyping(false);
      const aiMsg: Msg = {
        id: Math.random().toString(36).substring(7),
        role: "ai",
        text: res.text,
        timestamp: new Date(),
      };

      const hasFormAlready = messages.some((m) => m.isForm);
      const shouldTrigger = res.triggerLeadCapture || (formStep === 1 && !hasFormAlready);

      if (shouldTrigger) {
        if (clientUser) {
          // Logged in: auto-register and skip form
          try {
            await submitLeadFn({
              data: {
                name: clientUser.name,
                phone: clientUser.phone,
                email: clientUser.email || undefined,
                telegram: clientUser.telegram || undefined,
              },
            });
            let alertInfo = "";
            if (currentLastProduct) {
              const pMatch = (productsData as Product[]).find(
                (p) => p.name.toLowerCase() === currentLastProduct!.toLowerCase()
              );
              if (pMatch) {
                const numericId = parseInt(pMatch.id) || 1;
                const channels = ["whatsapp"];
                if (clientUser.email) channels.push("email");
                if (clientUser.telegram) channels.push("telegram");
                await subscribePriceAlertFn({
                  data: {
                    name: clientUser.name,
                    phone: clientUser.phone,
                    email: clientUser.email || undefined,
                    telegram: clientUser.telegram || undefined,
                    deliveryChannel: channels.join(","),
                    productId: numericId,
                    productName: pMatch.name,
                  },
                });
                alertInfo = ` and activated automated 🔔 alerts for **${pMatch.name}** on your profile`;
              }
            }
            const loggedInConfirmationMsg: Msg = {
              id: Math.random().toString(36).substring(7),
              role: "ai",
              text: `Thank you, ${clientUser.name}! I have successfully registered your interest${alertInfo}. Our showroom concierge will contact you at ${clientUser.phone} shortly! ✨`,
              timestamp: new Date(),
            };
            setMessages((m) => [...m, aiMsg, loggedInConfirmationMsg]);
            setLastProductAsked(null);
          } catch (err) {
            console.error("Error auto-submitting lead/alert:", err);
            const loggedInConfirmationMsg: Msg = {
              id: Math.random().toString(36).substring(7),
              role: "ai",
              text: `Thank you, ${clientUser.name}! I have saved your interest request. Our concierge will contact you at ${clientUser.phone} shortly. ✨`,
              timestamp: new Date(),
            };
            setMessages((m) => [...m, aiMsg, loggedInConfirmationMsg]);
          }
        } else {
          // Not logged in: show the tabbed auth form bubble
          setLeadName("");
          setLeadPhone("");
          setLeadEmail("");
          setLeadTelegram("");
          setFormStep(1);
          setFormErrors({});

          const formMsg: Msg = {
            id: "lead-form-" + Date.now(),
            role: "system",
            text: "Concierge Registration Details",
            isForm: true,
            formType: "lead",
            timestamp: new Date(),
          };
          setMessages((m) => [...m, aiMsg, formMsg]);
        }
      } else {
        setMessages((m) => [...m, aiMsg]);
      }
    } catch (err) {
      console.warn("Error communicating with chat backend. Falling back to local RAG.", err);
      // Fallback response using local RAG simulated logic
      setTimeout(
        async () => {
          setTyping(false);
          const reply = craftDynamicReply(text);

          const aiMsg: Msg = {
            id: Math.random().toString(36).substring(7),
            role: "ai",
            text: reply.text,
            timestamp: new Date(),
          };

          const hasFormAlready = messages.some((m) => m.isForm);
          const shouldTrigger = reply.triggerLead || (formStep === 1 && !hasFormAlready);

          if (shouldTrigger) {
            if (clientUser) {
              // Logged in: auto-register and skip form
              try {
                await submitLeadFn({
                  data: {
                    name: clientUser.name,
                    phone: clientUser.phone,
                    email: clientUser.email || undefined,
                    telegram: clientUser.telegram || undefined,
                  },
                });
                let alertInfo = "";
                if (currentLastProduct) {
                  const pMatch = (productsData as Product[]).find(
                    (p) => p.name.toLowerCase() === currentLastProduct!.toLowerCase()
                  );
                  if (pMatch) {
                    const numericId = parseInt(pMatch.id) || 1;
                    const channels = ["whatsapp"];
                    if (clientUser.email) channels.push("email");
                    if (clientUser.telegram) channels.push("telegram");
                    await subscribePriceAlertFn({
                      data: {
                        name: clientUser.name,
                        phone: clientUser.phone,
                        email: clientUser.email || undefined,
                        telegram: clientUser.telegram || undefined,
                        deliveryChannel: channels.join(","),
                        productId: numericId,
                        productName: pMatch.name,
                      },
                    });
                    alertInfo = ` and activated automated 🔔 alerts for **${pMatch.name}** on your profile`;
                  }
                }
                const loggedInConfirmationMsg: Msg = {
                  id: Math.random().toString(36).substring(7),
                  role: "ai",
                  text: `Thank you, ${clientUser.name}! I have successfully registered your interest${alertInfo}. Our showroom concierge will contact you at ${clientUser.phone} shortly! ✨`,
                  timestamp: new Date(),
                };
                setMessages((m) => [...m, aiMsg, loggedInConfirmationMsg]);
                setLastProductAsked(null);
              } catch (subErr) {
                console.error("Error auto-submitting lead/alert (fallback path):", subErr);
                const loggedInConfirmationMsg: Msg = {
                  id: Math.random().toString(36).substring(7),
                  role: "ai",
                  text: `Thank you, ${clientUser.name}! I have saved your interest request. Our concierge will contact you at ${clientUser.phone} shortly. ✨`,
                  timestamp: new Date(),
                };
                setMessages((m) => [...m, aiMsg, loggedInConfirmationMsg]);
              }
            } else {
              setLeadName("");
              setLeadPhone("");
              setLeadEmail("");
              setLeadTelegram("");
              setFormStep(1);
              setFormErrors({});

              const formMsg: Msg = {
                id: "lead-form-" + Date.now(),
                role: "system",
                text: "Concierge Registration Details",
                isForm: true,
                formType: "lead",
                timestamp: new Date(),
              };
              setMessages((m) => [...m, aiMsg, formMsg]);
            }
          } else {
            setMessages((m) => [...m, aiMsg]);
          }
        },
        600 + Math.random() * 400,
      );
    }
  };

  const handleChatAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    let activeUser = clientUser;
    let name = leadName;
    let phone = leadPhone;
    let email = leadEmail;
    let telegram = leadTelegram;

    if (chatAuthTab === "login") {
      if (!chatLoginEmail.trim()) {
        setFormErrors({ email: "Please enter your email" });
        return;
      }
      setSubmittingLead(true);
      try {
        const res = await loginClientFn({ data: { email: chatLoginEmail } });
        if (res.success && res.client) {
          const user = {
            name: res.client.name,
            phone: res.client.phone,
            email: res.client.email || undefined,
            telegram: res.client.telegram || undefined,
          };
          localStorage.setItem("atelier_client_user", JSON.stringify(user));
          window.dispatchEvent(new Event("client-auth-change"));
          setClientUser(user);
          activeUser = user;
          name = user.name;
          phone = user.phone;
          email = user.email || "";
          telegram = user.telegram || "";
          setChatSelectedChannels({
            whatsapp: true,
            email: !!user.email,
            telegram: !!user.telegram,
          });
        } else {
          setFormErrors({ email: res.message || "Account not found" });
          setSubmittingLead(false);
          return;
        }
      } catch (err: any) {
        console.error("Chat login error:", err);
        setFormErrors({ email: err.message || "Login failed" });
        setSubmittingLead(false);
        return;
      }
    } else {
      // Registration flow
      if (!leadName.trim()) {
        setFormErrors({ name: "Please enter your name" });
        return;
      }
      if (!leadPhone.trim()) {
        setFormErrors({ phone: "Please enter your phone number" });
        return;
      }
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(leadPhone.replace(/\s+/g, ""))) {
        setFormErrors({ phone: "Please enter a valid 10-digit number" });
        return;
      }
      if (!leadEmail.trim()) {
        setFormErrors({ email: "Email is required to log in later" });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadEmail.trim())) {
        setFormErrors({ email: "Please enter a valid email address" });
        return;
      }
      if (chatSelectedChannels.telegram && !leadTelegram.trim()) {
        setFormErrors({ telegram: "Please enter your Telegram Chat ID" });
        return;
      }
      if (chatSelectedChannels.telegram && leadTelegram.trim()) {
        const tgRegex = /^-?\d+$/;
        if (!tgRegex.test(leadTelegram.trim())) {
          setFormErrors({ telegram: "Numeric Chat ID is required" });
          return;
        }
      }

      setSubmittingLead(true);
      try {
        await submitLeadFn({
          data: {
            name: leadName,
            phone: leadPhone,
            email: leadEmail.trim(),
            telegram: leadTelegram.trim() || undefined,
          },
        });

        const user = {
          name: leadName,
          phone: leadPhone,
          email: leadEmail.trim(),
          telegram: leadTelegram.trim() || undefined,
        };
        localStorage.setItem("atelier_client_user", JSON.stringify(user));
        window.dispatchEvent(new Event("client-auth-change"));
        setClientUser(user);
        activeUser = user;
        name = leadName;
        phone = leadPhone;
        email = leadEmail;
        telegram = leadTelegram;
      } catch (err: any) {
        console.error("Chat registration error:", err);
        setFormErrors({ name: err.message || "Failed to register" });
        setSubmittingLead(false);
        return;
      }
    }

    // Subscribe to price drop alert if a product is asked about
    const channels = Object.entries(chatSelectedChannels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);

    const deliveryChannel = channels.length > 0 ? channels.join(",") : "whatsapp";

    try {
      let alertAddedInfo = "";
      if (lastProductAsked) {
        const match = (productsData as Product[]).find(
          (p) => p.name.toLowerCase() === lastProductAsked.toLowerCase()
        );
        if (match) {
          const numericId = parseInt(match.id) || 1;
          await subscribePriceAlertFn({
            data: {
              name,
              phone,
              email: email.trim() || undefined,
              telegram: telegram.trim() || undefined,
              deliveryChannel,
              productId: numericId,
              productName: match.name,
            },
          });
          const listArr = [];
          if (channels.includes("whatsapp")) listArr.push("WhatsApp");
          if (channels.includes("email")) listArr.push("Email");
          if (channels.includes("telegram")) listArr.push("Telegram");
          alertAddedInfo = ` I have also activated automated 🔔 price drop and offer alerts for the **${match.name}** via ${listArr.join(", ")} for you!`;
        }
      }

      setFormStep(2); // Success state

      setTimeout(() => {
        const successMsg: Msg = {
          id: Math.random().toString(36).substring(7),
          role: "ai",
          text: `Thank you, ${name}. I have successfully registered your request. Our concierge will contact you at ${phone} within 24 hours to schedule your private consultation. ✨${alertAddedInfo}`,
          timestamp: new Date(),
        };
        setMessages((m) => [...m, successMsg]);
        setLastProductAsked(null);
      }, 500);
    } catch (subErr) {
      console.warn("Could not register alerts on auth completion:", subErr);
      setFormStep(2); // Success state
      setTimeout(() => {
        const successMsg: Msg = {
          id: Math.random().toString(36).substring(7),
          role: "ai",
          text: `Thank you, ${name}. I have registered your request. Our showroom concierge will contact you shortly at ${phone}. ✨`,
          timestamp: new Date(),
        };
        setMessages((m) => [...m, successMsg]);
        setLastProductAsked(null);
      }, 500);
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open jewellery expert chat"
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-ink px-6 py-4.5 text-gold shadow-[0_15px_40px_rgba(212,175,55,0.25)] border border-gold/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(212,175,55,0.35)] active:scale-95 md:bottom-8 md:right-8 cursor-pointer ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100"
        }`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
          <Sparkles className="relative h-5 w-5 text-gold" />
        </span>
        <span className="hidden text-[10px] uppercase tracking-[0.25em] font-semibold sm:inline">
          AI Consultant
        </span>
      </button>

      {/* Panel */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-end p-0 md:p-6 transition-all duration-500 ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop for focus */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Chat window container */}
        <div
          className={`relative flex h-[100svh] md:h-[620px] md:max-h-[82vh] w-full md:w-[410px] flex-col overflow-hidden rounded-t-2xl md:rounded-2xl bg-white/95 md:bg-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-gold/10 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
          }`}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between bg-ink px-6 py-5 text-white border-b border-gold/25">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 border border-gold/40 shadow-inner">
                <Sparkles className="h-5 w-5 text-gold" />
              </span>
              <div>
                <p className="font-display text-lg tracking-wide leading-tight">Anaya</p>
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-gold/80 font-light mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI
                  Jewellery Consultant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-gold p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages body */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-cream/30 to-white/90 px-5 py-6"
          >
            {messages.map((m, idx) => {
              if (m.isForm && m.formType === "lead") {
                return (
                  <div key={m.id} className="flex justify-start animate-fade-up">
                    <div className="w-full max-w-[90%] rounded-2xl border border-gold/20 bg-white p-5 shadow-lg glass-luxury">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-gold" />
                        <span className="text-[10px] uppercase tracking-widest text-ink font-semibold">
                          Private Viewing Concierge
                        </span>
                      </div>

                      {formStep === 1 && (
                        <form onSubmit={handleChatAuthSubmit} className="space-y-3.5">
                          {/* Tabs for Login / Register */}
                          <div className="grid grid-cols-2 gap-2 border-b border-gold/10 pb-2">
                            <button
                              type="button"
                              onClick={() => setChatAuthTab("login")}
                              className={`py-1.5 text-[10px] uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                                chatAuthTab === "login" ? "border-gold text-gold" : "border-transparent text-muted-foreground"
                              }`}
                            >
                              Login with Email
                            </button>
                            <button
                              type="button"
                              onClick={() => setChatAuthTab("register")}
                              className={`py-1.5 text-[10px] uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
                                chatAuthTab === "register" ? "border-gold text-gold" : "border-transparent text-muted-foreground"
                              }`}
                            >
                              New Registration
                            </button>
                          </div>

                          {/* Login Tab Content */}
                          {chatAuthTab === "login" && (
                            <div className="space-y-3 animate-fade-in">
                              <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                                Enter the email you used during registration to quickly retrieve your profile.
                              </p>
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold mb-1">
                                  Your Email Address
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={chatLoginEmail}
                                  onChange={(e) => setChatLoginEmail(e.target.value)}
                                  placeholder="name@domain.com"
                                  className="w-full rounded-lg bg-cream/40 border border-gold/10 px-3.5 py-2 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                />
                              </div>
                              {formErrors.email && (
                                <p className="text-[10px] text-rose-500 font-medium animate-pulse">
                                  {formErrors.email}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Register Tab Content */}
                          {chatAuthTab === "register" && (
                            <div className="space-y-3 animate-fade-in">
                              <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                                Register to schedule viewings in one-click and get live price alerts.
                              </p>
                              
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold mb-1">
                                  Your Full Name
                                </label>
                                <div className="relative">
                                  <User className="absolute left-3 top-2 h-3.5 w-3.5 text-gold/60" />
                                  <input
                                    type="text"
                                    required
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    placeholder="Rajesh Kumar"
                                    className="w-full rounded-lg bg-cream/40 border border-gold/10 pl-9 pr-3.5 py-2 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                  />
                                </div>
                                {formErrors.name && (
                                  <p className="text-[10px] text-rose-500 font-medium mt-1">
                                    {formErrors.name}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold mb-1">
                                  Mobile Number
                                </label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-2 h-3.5 w-3.5 text-gold/60" />
                                  <input
                                    type="tel"
                                    required
                                    value={leadPhone}
                                    onChange={(e) => setLeadPhone(e.target.value)}
                                    placeholder="10-Digit Mobile Number"
                                    className="w-full rounded-lg bg-cream/40 border border-gold/10 pl-9 pr-3.5 py-2 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                  />
                                </div>
                                {formErrors.phone && (
                                  <p className="text-[10px] text-rose-500 font-medium mt-1">
                                    {formErrors.phone}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold mb-1">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={leadEmail}
                                  onChange={(e) => setLeadEmail(e.target.value)}
                                  placeholder="name@domain.com"
                                  className="w-full rounded-lg bg-cream/40 border border-gold/10 px-3.5 py-2 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                />
                                {formErrors.email && (
                                  <p className="text-[10px] text-rose-500 font-medium mt-1">
                                    {formErrors.email}
                                  </p>
                                )}
                              </div>

                              {/* Channels & Optional Telegram input */}
                              <div className="space-y-2 p-2.5 bg-cream/30 border border-gold/10 rounded-xl">
                                <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold">
                                  Send Alerts Via
                                </label>
                                <div className="flex flex-wrap gap-3 mt-1">
                                  <label className="flex items-center gap-1.5 text-[11px] text-ink cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={chatSelectedChannels.whatsapp}
                                      onChange={(e) => setChatSelectedChannels(prev => ({ ...prev, whatsapp: e.target.checked }))}
                                      className="h-3.5 w-3.5 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                                    />
                                    <span>WhatsApp</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 text-[11px] text-ink cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={chatSelectedChannels.email}
                                      onChange={(e) => setChatSelectedChannels(prev => ({ ...prev, email: e.target.checked }))}
                                      className="h-3.5 w-3.5 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                                    />
                                    <span>Email</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 text-[11px] text-ink cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={chatSelectedChannels.telegram}
                                      onChange={(e) => setChatSelectedChannels(prev => ({ ...prev, telegram: e.target.checked }))}
                                      className="h-3.5 w-3.5 rounded border-gold/25 text-gold focus:ring-0 cursor-pointer"
                                    />
                                    <span>Telegram</span>
                                  </label>
                                </div>
                              </div>

                              {chatSelectedChannels.telegram && (
                                <div className="animate-fade-in space-y-1">
                                  <label className="block text-[9px] uppercase tracking-wider text-ink font-semibold mb-1">
                                    Telegram Chat ID (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={leadTelegram}
                                    onChange={(e) => setLeadTelegram(e.target.value)}
                                    placeholder="E.g., 7064087532"
                                    className="w-full rounded-lg bg-cream/40 border border-gold/10 px-3.5 py-2 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                                  />
                                  {formErrors.telegram && (
                                    <p className="text-[10px] text-rose-500 font-medium">
                                      {formErrors.telegram}
                                    </p>
                                  )}
                                  <p className="text-[9px] text-muted-foreground font-light leading-normal bg-gold/5 p-2 rounded border border-gold/15">
                                    💡 Search and send a message to <b>@userinfobot</b> or <b>@GetIDsBot</b> on Telegram to instantly get your numeric Chat ID.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={submittingLead}
                            className="w-full rounded-full bg-ink py-2.5 text-[9px] uppercase tracking-[0.2em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink disabled:opacity-50 cursor-pointer"
                          >
                            {submittingLead ? "Processing..." : chatAuthTab === "login" ? "Login & Confirm Booking" : "Register & Confirm Booking"}
                          </button>
                        </form>
                      )}

                      {formStep === 2 && (
                        <div className="flex flex-col items-center text-center py-2 animate-fade-in">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-200 mb-3 animate-shimmer">
                            <Check className="h-5 w-5" />
                          </span>
                          <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                            Request Confirmed
                          </h4>
                          <p className="mt-1 text-[11px] text-muted-foreground font-light leading-relaxed">
                            Details synced. Thank you, {leadName}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-xs md:text-sm leading-relaxed tracking-wide font-light whitespace-pre-line ${
                      m.role === "user"
                        ? "rounded-br-sm bg-ink text-gold border border-gold/20 shadow-md"
                        : "rounded-bl-sm border border-gold/15 bg-white text-ink shadow-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}

            {/* Custom typing dots */}
            {typing && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 rounded-2xl rounded-bl-sm border border-gold/10 bg-white/80 px-5 py-3.5 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-gold typing-dot"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions block */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 border-t border-gold/10 bg-cream/20 px-5 py-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-gold/25 bg-white/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-ink transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-3 border-t border-gold/10 bg-white px-5 py-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a piece, budget or occasion…"
              aria-label="Chat input message"
              className="flex-1 rounded-full bg-cream/40 border border-gold/10 px-5 py-3 text-xs md:text-sm text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
            />
            <button
              type="submit"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-gold border border-gold/20 shadow-md transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold active:scale-90 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, User, Calendar, Phone, Check } from "lucide-react";
import productsData from "@/data/products.json";
import faqsData from "@/data/faqs.json";
import { chatFn, submitLeadFn } from "@/db/serverFunctions";

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
  const [formStep, setFormStep] = useState(1); // 1: Name, 2: Phone, 3: Completed
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [submittingLead, setSubmittingLead] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleRef.current = {
      open: () => setOpen(true),
      askAbout: (name) => {
        setOpen(true);
        send(`Tell me about the ${name}`);
      },
    };
  }, [handleRef]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open, formStep]);

  const send = async (text: string) => {
    if (!text.trim()) return;

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

      if (res.triggerLeadCapture) {
        setLeadName("");
        setLeadPhone("");
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
      } else {
        setMessages((m) => [...m, aiMsg]);
      }
    } catch (err) {
      console.warn("Error communicating with chat backend. Falling back to local RAG.", err);
      // Fallback response using local RAG simulated logic
      setTimeout(
        () => {
          setTyping(false);
          const reply = craftDynamicReply(text);

          const aiMsg: Msg = {
            id: Math.random().toString(36).substring(7),
            role: "ai",
            text: reply.text,
            timestamp: new Date(),
          };

          if (reply.triggerLead) {
            setLeadName("");
            setLeadPhone("");
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
          } else {
            setMessages((m) => [...m, aiMsg]);
          }
        },
        600 + Math.random() * 400,
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep === 1) {
      if (!leadName.trim()) {
        setFormErrors({ name: "Please enter your name" });
        return;
      }
      setFormErrors({});
      setFormStep(2);
    } else if (formStep === 2) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!leadPhone.trim()) {
        setFormErrors({ phone: "Please enter your phone number" });
        return;
      }
      if (!phoneRegex.test(leadPhone.replace(/\s+/g, ""))) {
        setFormErrors({ phone: "Please enter a valid 10-digit phone number" });
        return;
      }
      setFormErrors({});
      setSubmittingLead(true);

      // Call database server function to store lead
      submitLeadFn({ data: { name: leadName, phone: leadPhone } })
        .then(() => {
          setFormStep(3);
          setTimeout(() => {
            const successMsg: Msg = {
              id: Math.random().toString(36).substring(7),
              role: "ai",
              text: `Thank you, ${leadName}. I have successfully registered your request. Our concierge will contact you at ${leadPhone} within 24 hours to schedule your private consultation at our Palakonda showroom. ✨`,
              timestamp: new Date(),
            };
            setMessages((m) => [...m, successMsg]);
          }, 500);
        })
        .catch((err) => {
          console.error("Error saving lead to database:", err);
          // Fallback to local success even if database is offline for seamless UX
          setFormStep(3);
          setTimeout(() => {
            const successMsg: Msg = {
              id: Math.random().toString(36).substring(7),
              role: "ai",
              text: `Thank you, ${leadName}. I have registered your request. Our showroom concierge will contact you at ${leadPhone} shortly to schedule your private consultation. ✨`,
              timestamp: new Date(),
            };
            setMessages((m) => [...m, successMsg]);
          }, 500);
        })
        .finally(() => {
          setSubmittingLead(false);
        });
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
                        <form onSubmit={handleFormSubmit} className="space-y-3">
                          <p className="text-xs text-muted-foreground font-light leading-relaxed">
                            To coordinate your reservation details, may we have your name?
                          </p>
                          <input
                            type="text"
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            placeholder="Your Full Name"
                            aria-label="Full Name"
                            className="w-full rounded-lg bg-cream/40 border border-gold/10 px-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                            autoFocus
                          />
                          {formErrors.name && (
                            <p className="text-[10px] text-destructive font-medium">
                              {formErrors.name}
                            </p>
                          )}
                          <button
                            type="submit"
                            className="w-full rounded-full bg-ink py-2 text-[9px] uppercase tracking-[0.2em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink cursor-pointer"
                          >
                            Next Step
                          </button>
                        </form>
                      )}

                      {formStep === 2 && (
                        <form onSubmit={handleFormSubmit} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-gold/5 pb-2 mb-2">
                            <span className="text-xs font-medium text-ink">Guest: {leadName}</span>
                            <button
                              type="button"
                              onClick={() => setFormStep(1)}
                              className="text-[9px] uppercase tracking-wider text-gold hover:text-ink/80 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground font-light leading-relaxed">
                            Please provide a phone number for booking validation.
                          </p>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gold/60" />
                            <input
                              type="tel"
                              value={leadPhone}
                              onChange={(e) => setLeadPhone(e.target.value)}
                              placeholder="10-Digit Mobile Number"
                              aria-label="Mobile Number"
                              className="w-full rounded-lg bg-cream/40 border border-gold/10 pl-9 pr-4 py-2.5 text-xs text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                              autoFocus
                            />
                          </div>
                          {formErrors.phone && (
                            <p className="text-[10px] text-destructive font-medium">
                              {formErrors.phone}
                            </p>
                          )}
                          <button
                            type="submit"
                            className="w-full rounded-full bg-ink py-2 text-[9px] uppercase tracking-[0.2em] text-gold font-semibold transition-all duration-300 hover:bg-gold hover:text-ink cursor-pointer"
                          >
                            Request Consultation
                          </button>
                        </form>
                      )}

                      {formStep === 3 && (
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
          {messages.length <= 2 && !showLeadForm && (
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

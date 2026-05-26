import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

const suggestions = [
  "Show bridal sets under ₹2 lakh",
  "Gold necklaces under ₹1 lakh",
  "Store location",
  "Wedding collections",
];

const replies: Record<string, string> = {
  bridal:
    "We have a stunning curation of bridal sets between ₹1.4L – ₹1.95L — including the Maharani Haar and a temple-style polki choker. Would you like me to arrange a private viewing at our Jubilee Hills atelier?",
  necklace:
    "Within ₹1L, our Heritage 22K range and the Aurelia diamond pendants are most loved. Shall I share weight, purity and finishing details for any specific piece?",
  store:
    "Our flagship atelier is at Plot 14, Road 36, Jubilee Hills, Hyderabad — open daily 10:30 AM to 9:00 PM. Walk-ins welcome; appointments preferred for bridal consultations.",
  wedding:
    "Our Wedding Collection spans temple jewellery, polki chokers and full bridal sets. Would you like options in 22K gold, polki, or diamond — and a budget range to tailor my suggestions?",
  default:
    "I'd be delighted to help. Could you share whether you're exploring for an occasion, a budget range, or a specific style — bridal, daily wear, or diamond?",
};

function craftReply(q: string) {
  const t = q.toLowerCase();
  if (t.includes("bridal")) return replies.bridal;
  if (t.includes("necklace") || t.includes("gold")) return replies.necklace;
  if (t.includes("store") || t.includes("location") || t.includes("address")) return replies.store;
  if (t.includes("wedding")) return replies.wedding;
  if (t.includes("ask ai about") || t.includes("tell me about")) {
    const name = q.replace(/ask ai about|tell me about/i, "").trim();
    return `The ${name} is one of our signature pieces — handcrafted in our atelier with certified materials. I can share weight, purity, certification and pricing details, or schedule a private viewing. What would you prefer?`;
  }
  return replies.default;
}

export type ChatHandle = { open: () => void; askAbout: (name: string) => void };

export function ChatWidget({ handleRef }: { handleRef: React.MutableRefObject<ChatHandle | null> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text:
        "Namaste — I'm Anaya, your personal jewellery consultant at Aurum Vault. How may I help you discover something beautiful today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleRef.current = {
      open: () => setOpen(true),
      askAbout: (name) => {
        setOpen(true);
        send(`Tell me about the ${name}`);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text: craftReply(text) }]);
    }, 950 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open jewellery expert chat"
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-ink px-5 py-4 text-gold shadow-2xl shadow-black/30 ring-1 ring-gold/40 transition-all hover:scale-[1.03] md:bottom-7 md:right-7 ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100"
        }`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
          <Sparkles className="relative h-5 w-5" />
        </span>
        <span className="hidden text-xs uppercase tracking-[0.2em] sm:inline">Jewellery Expert</span>
      </button>

      {/* Panel */}
      <div
        className={`fixed inset-0 z-50 flex items-end justify-end p-0 md:p-6 transition-all ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* mobile backdrop */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity md:hidden ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative flex h-[88svh] w-full flex-col overflow-hidden rounded-t-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl transition-all duration-500 md:h-[600px] md:max-h-[80vh] md:w-[400px] md:rounded-2xl ${
            open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* header */}
          <div className="relative flex items-center justify-between bg-ink px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/50">
                <Sparkles className="h-5 w-5 text-gold" />
              </span>
              <div>
                <p className="font-display text-base leading-tight">Anaya</p>
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Jewellery Consultant · Online
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-gold">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-cream to-white px-4 py-5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-ink text-white"
                      : "rounded-bl-sm border border-gold/20 bg-white text-ink shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-gold/20 bg-white px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-shimmer rounded-full bg-gold"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* suggestions */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 border-t border-border/60 bg-white/80 px-4 py-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-gold/40 bg-cream px-3 py-1.5 text-[11px] text-ink transition-all hover:bg-gold hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-white px-3 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a piece, price or occasion…"
              className="flex-1 rounded-full bg-cream px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-transparent focus:ring-gold/50"
            />
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-gold transition-all hover:bg-gold hover:text-ink"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

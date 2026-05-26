import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { chatFn, submitLeadFn } from "@/db/serverFunctions";

type Msg = { role: "user" | "ai"; text: string };

const suggestions = [
  "Show bridal sets under ₹2 lakh",
  "Gold necklaces under ₹1 lakh",
  "Store location",
  "Wedding collections",
];

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

  // Lead Form state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);

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

  const send = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message immediately
    const updatedMessages = [...messages, { role: "user" as const, text }];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
      // Map message history to server format
      const chatHistory = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      // Call our TanStack Start server function
      const res = await chatFn({ data: { message: text, history: chatHistory } });
      
      setTyping(false);
      setMessages((m) => [...m, { role: "ai" as const, text: res.text }]);
      
      if (res.triggerLeadCapture) {
        setShowLeadForm(true);
      }
    } catch (err) {
      console.error("Error communicating with chat backend:", err);
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          role: "ai" as const,
          text: "I apologize, but I am having trouble connecting to my catalogue database right now. Would you like to try again shortly, or visit our Jubilee Hills atelier?",
        },
      ]);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setSubmittingLead(true);
    
    try {
      await submitLeadFn({ data: { name: leadName, phone: leadPhone } });
      setMessages((m) => [
        ...m,
        {
          role: "ai" as const,
          text: `Thank you, ${leadName}! I have registered your request. Our boutique manager at Jubilee Hills will contact you at ${leadPhone} shortly to arrange your consultation.`,
        },
      ]);
      setShowLeadForm(false);
      setLeadName("");
      setLeadPhone("");
    } catch (err) {
      console.error("Error submitting lead:", err);
      setMessages((m) => [
        ...m,
        {
          role: "ai" as const,
          text: "I had trouble saving your contact information. Please share it again, or reach us at plot 14, Jubilee Hills.",
        },
      ]);
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
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-ink px-6 py-4.5 text-gold shadow-[0_15px_40px_rgba(212,175,55,0.25)] border border-gold/40 transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(212,175,55,0.35)] active:scale-95 md:bottom-8 md:right-8 ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100"
        }`}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
          <Sparkles className="relative h-5 w-5 text-gold" />
        </span>
        <span className="hidden text-[10px] uppercase tracking-[0.25em] font-semibold sm:inline">AI Consultant</span>
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
          className={`relative flex h-full md:h-[620px] md:max-h-[82vh] w-full md:w-[410px] flex-col overflow-hidden rounded-t-2xl md:rounded-2xl bg-white/95 md:bg-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-gold/10 backdrop-blur-2xl transition-all duration-500 ${
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI Jewellery Consultant
                </p>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)} 
              className="text-white/60 hover:text-gold p-1.5 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages body */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-cream/30 to-white/90 px-5 py-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex animate-fade-up ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4.5 py-3 text-xs md:text-sm leading-relaxed tracking-wide font-light whitespace-pre-wrap ${
                    m.role === "user"
                      ? "rounded-br-sm bg-ink text-gold border border-gold/20 shadow-md"
                      : "rounded-bl-sm border border-gold/15 bg-white text-ink shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            
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
                  className="rounded-full border border-gold/25 bg-white/90 px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-ink transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold hover:-translate-y-0.5 active:scale-95 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input or lead form */}
          {showLeadForm ? (
            <form
              onSubmit={handleLeadSubmit}
              className="flex flex-col gap-3 border-t border-gold/10 bg-white px-5 py-5 animate-fade-up"
            >
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">Arrange Private Viewing / Callback</p>
                <button 
                  type="button" 
                  onClick={() => setShowLeadForm(false)} 
                  className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <input
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Enter Your Name"
                className="rounded-lg bg-cream/40 border border-gold/10 px-4 py-2.5 text-xs md:text-sm text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
              />
              <div className="flex gap-2">
                <input
                  required
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Enter Phone Number"
                  className="flex-1 rounded-lg bg-cream/40 border border-gold/10 px-4 py-2.5 text-xs md:text-sm text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
                />
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="rounded-lg bg-ink px-4.5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-gold border border-gold/20 shadow-md transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {submittingLead ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          ) : (
            /* Chat Form input */
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
                className="flex-1 rounded-full bg-cream/40 border border-gold/10 px-5 py-3 text-xs md:text-sm text-ink outline-none transition-all focus:border-gold/60 focus:bg-white focus:ring-1 focus:ring-gold/30 font-light"
              />
              <button
                type="submit"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-ink text-gold border border-gold/20 shadow-md transition-all duration-300 hover:bg-gold hover:text-ink hover:border-gold active:scale-90"
                aria-label="Send message"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

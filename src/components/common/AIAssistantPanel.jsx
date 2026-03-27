import { useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { getLocalContext } from "../../services/ragService";
import { chatWithContext } from "../../services/llmService";
import { generateBudgetItinerary } from "../../services/tripPlannerService";
import { useAuth } from "../../hooks/useAuth";

const SYSTEM_PROMPT =
  "You are TravelMind AI assistant. Answer with practical, city-specific advice grounded in provided context. Keep responses concise and actionable.";

const KNOWN_CITIES = [
  "bengaluru",
  "mumbai",
  "delhi",
  "chennai",
  "hyderabad",
  "kolkata",
  "goa",
  "jaipur",
  "agra",
  "varanasi",
];

const detectBudgetItineraryIntent = (message) => {
  const lower = message.toLowerCase();
  return (
    (lower.includes("budget") ||
      lower.includes("₹") ||
      lower.includes("rs") ||
      lower.includes("rupee")) &&
    (lower.includes("itinerary") || lower.includes("plan") || lower.includes("trip") || lower.includes("days"))
  );
};

function extractCity(message, fallbackCity) {
  const lower = message.toLowerCase();
  const found = KNOWN_CITIES.find((name) => lower.includes(name));
  if (!found) return fallbackCity;
  return found.charAt(0).toUpperCase() + found.slice(1);
}

function extractBudget(message) {
  const lower = message.toLowerCase();
  const pattern = /(₹|rs\.?|rupees?)\s*([0-9][0-9,]*)|([0-9][0-9,]*)\s*(budget|inr)/i;
  const match = lower.match(pattern);
  const value = match?.[2] || match?.[3];
  if (!value) return 10000;
  return Number(String(value).replace(/,/g, "")) || 10000;
}

function extractDays(message) {
  const lower = message.toLowerCase();
  const match = lower.match(/(\d+)\s*(day|days|night|nights)/i);
  if (!match) return 3;
  return Number(match[1]) || 3;
}

function extractPurpose(message) {
  const lower = message.toLowerCase();
  if (lower.includes("business")) return "business";
  if (lower.includes("adventure")) return "adventure";
  if (lower.includes("cultural") || lower.includes("culture")) return "cultural";
  return "leisure";
}

function extractPreferences(message) {
  const lower = message.toLowerCase();
  const tags = ["food", "culture", "adventure", "shopping"];
  const prefs = tags.filter((tag) => lower.includes(tag));
  return prefs.length ? prefs : ["food", "culture"];
}

export default function AIAssistantPanel({ city = "Bengaluru" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me destination questions. I use live RAG context from curated city knowledge.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const onSend = async () => {
    if (!canSend) return;
    const question = input.trim();

    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      if (detectBudgetItineraryIntent(question)) {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: "Generating your budget itinerary..." },
        ]);

        const intentCity = extractCity(question, city);
        const budget = extractBudget(question);
        const days = extractDays(question);
        const purpose = extractPurpose(question);
        const preferences = extractPreferences(question);

        const budgetAnswer = await generateBudgetItinerary(
          user?.uid || "anonymous",
          intentCity,
          budget,
          days,
          purpose,
          preferences
        );

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            text: budgetAnswer,
            badge: "Budget Itinerary",
          },
        ]);
        return;
      }

      const context = await getLocalContext(question, city);
      const answer = await chatWithContext(SYSTEM_PROMPT, context, question);
      setMessages((current) => [...current, { role: "assistant", text: answer, typewriter: true }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: `Could not fetch answer: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 rounded-full bg-accent p-4 text-primary shadow-xl hover:scale-105"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[460px] w-[min(92vw,420px)] flex-col rounded-2xl border border-slate-700 bg-primary/95 p-3 shadow-2xl">
          <div className="mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
            <Bot className="text-accent" />
            <h4 className="font-heading">TravelMind Assistant</h4>
          </div>

          <div className="flex-1 space-y-2 overflow-auto pr-1">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`rounded-xl p-2 text-sm ${
                  msg.role === "user" ? "ml-10 bg-slate-700" : "mr-10 bg-slate-800"
                }`}
              >
                <p className={msg.typewriter ? "typewriter" : ""}>{msg.text}</p>
                {msg.badge ? (
                  <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    {msg.badge}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder={`Ask about ${city}...`}
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={onSend}
              className="rounded-xl bg-accent px-3 text-primary disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

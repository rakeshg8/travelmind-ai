import { Compass, Sparkles } from "lucide-react";

export default function ProactiveSuggestions({ suggestions, onGenerate, loading }) {
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-lg">
          <Sparkles className="text-success" />
          Proactive Suggestions
        </h3>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="rounded-lg bg-success px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50"
        >
          {loading ? "Generating..." : "Get Suggestions"}
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <h4 className="mb-1 flex items-center gap-2 font-semibold">
              <Compass className="h-4 w-4 text-accent" />
              {item.title}
            </h4>
            <p className="text-xs uppercase text-slate-400">{item.category}</p>
            <p className="mt-1 text-sm text-slate-200">{item.why_recommended}</p>
            <p className="mt-2 text-xs text-slate-300">{item.distance} • {item.duration} • {item.budget}</p>
          </article>
        ))}
        {!suggestions.length ? <p className="text-sm text-slate-400">No suggestions yet.</p> : null}
      </div>
    </section>
  );
}

import MatchCard from "./MatchCard";

export default function GroupMatchList({ matches, onFind, onConnect, loading }) {
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-lg">Find Travel Buddies</h3>
        <button
          type="button"
          onClick={onFind}
          disabled={loading}
          className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50"
        >
          {loading ? "Matching..." : "Find Travel Buddies"}
        </button>
      </div>

      <div className="space-y-2">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onConnect={onConnect} />
        ))}
        {!matches.length ? <p className="text-sm text-slate-400">No matches yet.</p> : null}
      </div>
    </section>
  );
}

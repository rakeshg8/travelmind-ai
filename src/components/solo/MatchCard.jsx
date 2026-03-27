import { User, UserPlus } from "lucide-react";

export default function MatchCard({ match, onConnect }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 font-semibold"><User className="h-4 w-4" />{match.user?.name || "Traveler"}</h4>
        <span className="rounded-full bg-accent/20 px-2 py-1 text-xs text-accent">{match.matchPercent}% Match</span>
      </div>
      <p className="text-sm text-slate-300">Destination: {match.destination}</p>
      <p className="text-sm text-slate-300">Date: {match.travel_date || "Flexible"}</p>
      <p className="mt-1 text-xs text-slate-400">Interests: {(match.interests || match.user?.interests || []).join(", ") || "Not specified"}</p>
      <button
        type="button"
        onClick={() => onConnect(match)}
        className="mt-3 flex items-center gap-2 rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-300"
      >
        <UserPlus className="h-4 w-4" />
        Connect
      </button>
    </article>
  );
}

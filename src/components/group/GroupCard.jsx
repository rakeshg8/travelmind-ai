import { UserPlus, Users } from "lucide-react";
import { formatDate } from "../../utils/helpers";

export default function GroupCard({ group, onOpen, isMember, onJoin }) {
  return (
    <article className="glass-card p-3">
      <h4 className="font-heading text-lg">{group.name}</h4>
      <p className="text-sm text-slate-300">{group.destination}</p>
      <p className="text-xs text-slate-400">Travel Date: {formatDate(group.travel_date)}</p>
      <p className="mt-2 text-sm text-slate-200">{group.description || "No description"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-accent/20 px-3 py-2 text-sm text-accent"
          onClick={() => onOpen(group)}
        >
          <Users className="h-4 w-4" />
          Open Group
        </button>
        {!isMember && onJoin ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-300"
            onClick={() => onJoin(group.id)}
          >
            <UserPlus className="h-4 w-4" />
            Request to Join
          </button>
        ) : null}
      </div>
    </article>
  );
}

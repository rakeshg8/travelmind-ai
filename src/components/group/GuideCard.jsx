import { Star } from "lucide-react";

export default function GuideCard({ guide, onView, onBook }) {
  return (
    <article className="glass-card p-3">
      <div className="mb-2 h-28 rounded-lg bg-slate-800/70" />
      <h4 className="font-heading text-lg">{guide.user?.name || "Local Guide"}</h4>
      <p className="text-sm text-slate-300">{guide.city}</p>
      <p className="text-sm text-slate-300">{guide.experience_years || 0} years exp • ₹{guide.price_per_day}/day</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-amber-300"><Star className="h-4 w-4" />{guide.avg_rating || 0} avg rating</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onView(guide)} type="button" className="rounded-lg bg-slate-700 px-3 py-1 text-sm">
          View
        </button>
        <button onClick={() => onBook(guide)} type="button" className="rounded-lg bg-accent px-3 py-1 text-sm text-primary">
          Book
        </button>
      </div>
    </article>
  );
}

import { useMemo, useState } from "react";
import GuideCard from "./GuideCard";

export default function GuideList({ guides, onView, onBook }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return guides;
    return guides.filter((guide) => guide.city?.toLowerCase().includes(filter.toLowerCase()));
  }, [guides, filter]);

  return (
    <section className="space-y-3">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by city"
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onView={onView} onBook={onBook} />
        ))}
      </div>
    </section>
  );
}

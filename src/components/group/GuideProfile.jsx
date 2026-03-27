export default function GuideProfile({ guide }) {
  if (!guide) {
    return <p className="text-sm text-slate-400">Select a guide to view profile.</p>;
  }

  return (
    <div className="glass-card p-4">
      <h3 className="font-heading text-xl">{guide.user?.name || "Guide Profile"}</h3>
      <p className="text-sm text-slate-300">City: {guide.city}</p>
      <p className="text-sm text-slate-300">Languages: {(guide.languages || []).join(", ") || "N/A"}</p>
      <p className="mt-2 text-sm">{guide.bio || "No bio added."}</p>
      <p className="mt-2 text-xs text-slate-400">Experience: {guide.experience_years || 0} years</p>
    </div>
  );
}

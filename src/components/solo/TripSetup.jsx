import { useState } from "react";

// Legacy single-stop setup. Multi-stop flow is now handled inline in SoloDashboard.

const PURPOSES = ["business", "leisure", "adventure", "cultural"];
const BUDGETS = ["budget", "mid", "luxury"];

export default function TripSetup({ onSubmit, loading }) {
  const [form, setForm] = useState({
    destination: "Bengaluru",
    travel_date: "",
    travel_purpose: "business",
    budget_range: "mid",
    interests: "Food,Culture",
    flight_number: "",
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      interests: form.interests
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    });
  };

  return (
    <form className="glass-card grid gap-3 p-4 md:grid-cols-3" onSubmit={submit}>
      <div>
        <label className="mb-1 block text-sm">Destination City</label>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.destination}
          onChange={(e) => setField("destination", e.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm">Travel Date</label>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.travel_date}
          onChange={(e) => setField("travel_date", e.target.value)}
          type="date"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm">Trip Purpose</label>
        <select
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.travel_purpose}
          onChange={(e) => setField("travel_purpose", e.target.value)}
        >
          {PURPOSES.map((purpose) => (
            <option value={purpose} key={purpose}>
              {purpose}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm">Budget Level</label>
        <select
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.budget_range}
          onChange={(e) => setField("budget_range", e.target.value)}
        >
          {BUDGETS.map((budget) => (
            <option value={budget} key={budget}>
              {budget}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm">Interests (comma separated)</label>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.interests}
          onChange={(e) => setField("interests", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm">Flight Number (optional)</label>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.flight_number}
          onChange={(e) => setField("flight_number", e.target.value)}
          placeholder="6E 445"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="md:col-span-3 rounded-xl bg-accent px-4 py-3 font-semibold text-primary disabled:opacity-50"
      >
        {loading ? "Initializing your trip..." : "Start AI Trip Monitoring"}
      </button>
    </form>
  );
}

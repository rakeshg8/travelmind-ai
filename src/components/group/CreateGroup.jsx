import { useState } from "react";

export default function CreateGroup({ onCreate }) {
  const [form, setForm] = useState({
    name: "",
    destination: "",
    travel_date: "",
    description: "",
    max_members: 10,
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    onCreate(form);
    setForm({ name: "", destination: "", travel_date: "", description: "", max_members: 10 });
  };

  return (
    <form className="glass-card grid gap-3 p-4 md:grid-cols-2" onSubmit={submit}>
      <input
        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        placeholder="Group name"
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        required
      />
      <input
        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        placeholder="Destination"
        value={form.destination}
        onChange={(e) => setField("destination", e.target.value)}
        required
      />
      <input
        type="date"
        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        value={form.travel_date}
        onChange={(e) => setField("travel_date", e.target.value)}
        required
      />
      <input
        type="number"
        min="2"
        max="20"
        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        value={form.max_members}
        onChange={(e) => setField("max_members", Number(e.target.value))}
      />
      <textarea
        className="md:col-span-2 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
        placeholder="Description"
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
      />
      <button className="md:col-span-2 rounded-lg bg-accent px-3 py-2 font-semibold text-primary" type="submit">
        Create Group
      </button>
    </form>
  );
}

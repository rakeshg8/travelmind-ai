import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../config/supabase";

export default function ProfilePage() {
  const { user, profile, setProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
  });
  const [status, setStatus] = useState("");

  const save = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    const payload = { id: user.uid, email: user.email, ...form };
    const { data, error } = await supabase.from("users").upsert(payload).select().single();
    if (error) {
      setStatus(error.message);
      return;
    }
    setProfile(data);
    setStatus("Saved successfully.");
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <form className="glass-card space-y-3 p-6" onSubmit={save}>
        <h1 className="font-heading text-3xl">Profile</h1>
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
        />
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Phone"
        />
        <textarea
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          value={form.bio}
          onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
          placeholder="Bio"
        />
        <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-primary" type="submit">
          Save Profile
        </button>
        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </form>
    </main>
  );
}

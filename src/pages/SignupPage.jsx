import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

const INTEREST_OPTIONS = ["Adventure", "Food", "Culture", "Business", "Nature", "Shopping"];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    travel_style: "mid",
    interests: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.signup(form.email, form.password, form);
      navigate("/solo");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-8">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-xl space-y-4 p-6">
        <h1 className="font-heading text-3xl">Create your account</h1>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            type="email"
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            type="password"
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Travel Style</label>
          <select
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
            value={form.travel_style}
            onChange={(e) => setForm((prev) => ({ ...prev, travel_style: e.target.value }))}
          >
            <option value="budget">Budget</option>
            <option value="mid">Mid</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Interests</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const active = form.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    active ? "border-accent bg-accent/20 text-accent" : "border-slate-600"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-slate-300">
          Already have an account? <Link className="text-accent" to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

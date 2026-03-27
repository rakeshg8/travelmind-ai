import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.login(email, password);
      navigate("/solo");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.loginWithGoogle();
      navigate("/solo");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4">
      <form onSubmit={handleLogin} className="glass-card w-full max-w-md space-y-4 p-6">
        <h1 className="font-heading text-3xl">Welcome back</h1>
        <input
          type="email"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <button
          className="w-full rounded-xl border border-slate-600 px-4 py-3"
          type="button"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </button>
        <p className="text-center text-sm text-slate-300">
          New user? <Link className="text-accent" to="/signup">Create account</Link>
        </p>
      </form>
    </main>
  );
}

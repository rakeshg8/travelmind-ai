import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
  const { profile } = useAuth();

  return (
    <aside className="glass-card hidden h-fit w-64 p-4 lg:block">
      <h3 className="mb-3 font-heading text-lg">Quick Access</h3>
      <nav className="space-y-2 text-sm text-slate-200">
        <Link className="block rounded-md p-2 hover:bg-slate-800" to="/solo">
          Solo Dashboard
        </Link>
        <Link className="block rounded-md p-2 hover:bg-slate-800" to="/group">
          Group Travel
        </Link>
        <Link className="block rounded-md p-2 hover:bg-slate-800" to="/profile">
          Profile
        </Link>
        {profile?.role === "admin" ? (
          <Link className="block rounded-md p-2 hover:bg-slate-800" to="/admin">
            Admin
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { Plane, UserCircle } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { authService } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-primary/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg text-accent">
          <Plane className="h-5 w-5" />
          TravelMind AI
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell />
              <Link to="/profile" className="text-sm text-slate-200">
                <span className="hidden md:inline">{profile?.name || user.email}</span>
                <UserCircle className="inline h-5 w-5 md:ml-2" />
              </Link>
              <button
                className="rounded-md border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800"
                onClick={onLogout}
                type="button"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-accent">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

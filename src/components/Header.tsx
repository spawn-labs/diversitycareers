import { Link, useNavigate } from "react-router-dom";
import { logout } from "../lib/api";

interface HeaderProps {
  auth?: { authenticated: boolean; email?: string; role?: string } | null;
  onAuthChange?: () => void;
}

export function Header({ auth, onAuthChange }: HeaderProps) {
  const navigate = useNavigate();
  const session = auth?.authenticated ? auth : null;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      await onAuthChange?.();
      navigate("/");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight text-brand-700">
          Diversity<span className="text-accent-500">Careers</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:gap-4">
          <Link to="/jobs" className="rounded-lg px-3 py-2 text-muted hover:bg-brand-50 hover:text-brand-700">
            Find Jobs
          </Link>
          <Link
            to="/employer/post"
            className="rounded-lg bg-accent-500 px-3 py-2 text-white shadow-sm hover:bg-accent-400"
          >
            Post a Job
          </Link>
          {auth === null ? null : session ? (
            <>
              <Link
                to={session.role === "admin" ? "/admin" : "/employer/dashboard"}
                className="rounded-lg px-3 py-2 text-muted hover:bg-brand-50"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-brand-700 hover:bg-brand-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg px-3 py-2 text-brand-700 hover:bg-brand-50">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

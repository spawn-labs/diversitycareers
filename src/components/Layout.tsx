import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { authMe } from "../lib/api";
import { Header } from "./Header";

export function Layout() {
  const location = useLocation();
  const [auth, setAuth] = useState<{
    authenticated: boolean;
    email?: string;
    role?: string;
  } | null>(null);

  const refreshAuth = useCallback(() => {
    return authMe()
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [location.pathname, refreshAuth]);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header auth={auth} onAuthChange={refreshAuth} />
      <main className="flex-1">
        <Outlet context={{ auth, refreshAuth }} />
      </main>
      <footer className="border-t border-stone-200 bg-white py-8 text-center text-sm text-muted">
        <p className="font-display font-bold text-brand-700">Diversity Careers</p>
        <p className="mt-1">Connecting inclusive employers with talented job seekers across the U.S.</p>
      </footer>
    </div>
  );
}

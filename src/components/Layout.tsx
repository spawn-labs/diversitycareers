import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { authMe } from "../lib/api";
import { Header } from "./Header";

export function Layout() {
  const [auth, setAuth] = useState<{
    authenticated: boolean;
    email?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    authMe()
      .then(setAuth)
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header auth={auth} onAuthChange={() => authMe().then(setAuth).catch(() => null)} />
      <main className="flex-1">
        <Outlet context={{ auth, refreshAuth: () => authMe().then(setAuth) }} />
      </main>
      <footer className="border-t border-stone-200 bg-white py-8 text-center text-sm text-muted">
        <p className="font-display font-bold text-brand-700">Diversity Careers</p>
        <p className="mt-1">Connecting inclusive employers with talented job seekers across the U.S.</p>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { authMe, login } from "../lib/api";

type LayoutContext = {
  refreshAuth: () => Promise<unknown>;
};

export function Login() {
  const navigate = useNavigate();
  const { refreshAuth } = useOutletContext<LayoutContext>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password, formLoadedAt: 0 });
      await refreshAuth();
      const me = await authMe();
      navigate(me.role === "admin" ? "/admin" : "/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold text-brand-700">Sign in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <ErrorAlert message={error} />
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] opacity-0"
          aria-hidden
        />
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white"
        >
          Sign in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New employer?{" "}
        <Link to="/employer/post" className="font-semibold text-brand-600">
          Post a job
        </Link>
      </p>
    </div>
  );
}

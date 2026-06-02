import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { checkoutStatus, linkJob, register } from "../lib/api";

export function EmployerSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [jobId, setJobId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formLoadedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("Missing checkout session.");
      return;
    }

    let attempts = 0;
    const poll = () => {
      checkoutStatus(sessionId)
        .then((data) => {
          setEmail(data.employerEmail);
          if (data.paid && data.jobId) {
            setJobId(data.jobId);
            setStatus("paid");
          } else if (attempts < 15) {
            attempts++;
            setStatus("pending");
            setTimeout(poll, 2000);
          } else {
            setStatus("pending");
          }
        })
        .catch((e) => {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Could not verify payment");
        });
    };
    poll();
  }, [sessionId]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register({ email, password, companyName, formLoadedAt });
      if (jobId) await linkJob(jobId);
      window.location.href = "/employer/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-brand-700">Payment received</h1>

      {status === "loading" && <p className="mt-4 text-muted">Confirming your payment…</p>}
      {status === "pending" && (
        <p className="mt-4 text-muted">
          Payment is processing. This page will update when your job is live (usually within a
          minute).
        </p>
      )}
      {status === "error" && <ErrorAlert message={error} />}
      {status === "paid" && (
        <>
          <p className="mt-4 text-brand-700">
            Your job is live! Create an account to manage listings and view applications.
          </p>
          <form onSubmit={createAccount} className="mt-6 space-y-4">
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
                readOnly
                value={email}
                className="mt-1 w-full rounded-lg border bg-stone-50 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Password (8+ characters)</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Company name</span>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-3 font-bold text-white"
            >
              Create account & go to dashboard
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="font-semibold text-brand-600">
              Already registered? Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

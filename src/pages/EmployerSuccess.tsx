import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { ListingDurationNotice } from "../components/ListingDurationNotice";
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
  const [accountCreated, setAccountCreated] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!sessionId) return;
    const data = await checkoutStatus(sessionId);
    setEmail(data.employerEmail);
    if (data.paid && data.jobId) {
      setJobId(data.jobId);
      setStatus("paid");
      return true;
    }
    if (data.employerEmail) {
      setStatus("pending");
    }
    return false;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("Missing checkout session.");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      try {
        const done = await refreshStatus();
        if (cancelled) return;
        if (!done && attempts < 20) {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Could not verify payment");
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, refreshStatus]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      let activeJobId = jobId;
      if (!activeJobId && sessionId) {
        const latest = await checkoutStatus(sessionId);
        activeJobId = latest.jobId ?? null;
        if (latest.jobId) setJobId(latest.jobId);
        if (latest.paid) setStatus("paid");
      }

      await register({ email, password, companyName, formLoadedAt });
      if (activeJobId) await linkJob(activeJobId);
      setAccountCreated(true);
      window.location.href = "/employer/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  const showAccountForm = (status === "paid" || status === "pending") && email && !accountCreated;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-brand-700">Payment received</h1>
      <div className="mt-4">
        <ListingDurationNotice compact />
      </div>

      {status === "loading" && (
        <p className="mt-4 text-muted">Confirming your payment with Stripe…</p>
      )}

      {status === "pending" && (
        <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            Your payment succeeded. We&apos;re publishing your job now — this usually takes a few
            seconds.
          </p>
          <button
            type="button"
            onClick={() => refreshStatus().catch(() => null)}
            className="font-bold text-brand-700 underline"
          >
            Refresh status
          </button>
        </div>
      )}

      {status === "paid" && (
        <p className="mt-4 text-brand-700">
          Your job is live! Create a password below to manage your listing and view applications.
        </p>
      )}

      {status === "error" && <ErrorAlert message={error} />}

      {showAccountForm && (
        <>
          <p className="mt-4 text-sm text-muted">
            There is no preset password — choose one now for <strong>{email}</strong>.
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
              <span className="text-sm font-semibold">Create password (8+ characters)</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                autoComplete="new-password"
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
              Already created an account? Sign in
            </Link>
          </p>
        </>
      )}

      {!sessionId && (
        <p className="mt-4 text-sm text-muted">
          Return here from Stripe after checkout, or sign in at{" "}
          <Link to="/login" className="font-semibold text-brand-600">
            /login
          </Link>{" "}
          if you already registered.
        </p>
      )}
    </div>
  );
}

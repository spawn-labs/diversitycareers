import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { createCheckout } from "../lib/api";

const CATEGORIES = [
  "Technology",
  "Human Resources",
  "Marketing",
  "Healthcare",
  "Customer Service",
  "Finance",
  "Education",
  "General",
];

export function EmployerPost() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formLoadedAt] = useState(() => Date.now());

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [remote, setRemote] = useState(false);
  const [category, setCategory] = useState("General");
  const [employmentType, setEmploymentType] = useState("full-time");
  const [payMin, setPayMin] = useState("");
  const [payMax, setPayMax] = useState("");
  const [payPeriod, setPayPeriod] = useState<"year" | "hour">("year");
  const [applyUrl, setApplyUrl] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [employerEmail, setEmployerEmail] = useState("");

  async function handlePayFirst(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { checkoutUrl } = await createCheckout(
        {
          title,
          company,
          description,
          location: {
            city: city || undefined,
            state: state || undefined,
            zip: zip || undefined,
            remote,
          },
          category,
          employmentType,
          payMin: payMin ? Number(payMin) : undefined,
          payMax: payMax ? Number(payMax) : undefined,
          payPeriod,
          applyUrl: applyUrl || undefined,
          applyEmail: applyEmail || undefined,
          employerEmail,
        },
        formLoadedAt,
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-brand-700">Post a job</h1>
      <p className="mt-2 text-muted">
        Payment is required <strong>before</strong> your listing goes live. You&apos;ll complete
        checkout with Stripe, then create an account to manage your post.
      </p>

      <form onSubmit={handlePayFirst} className="mt-8 space-y-5">
        <ErrorAlert message={error} />
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          className="absolute -left-[9999px] opacity-0"
          aria-hidden
        />

        <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <legend className="font-display font-bold text-brand-700">Job details</legend>
          <label className="block">
            <span className="text-sm font-semibold">Job title *</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Company *</span>
            <input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Description *</span>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Employment type</span>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <legend className="font-display font-bold text-brand-700">Location</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
            <span className="text-sm font-semibold">Remote position</span>
          </label>
          {!remote && (
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="ZIP"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="rounded-lg border px-3 py-2"
              />
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <legend className="font-display font-bold text-brand-700">Compensation (optional)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              type="number"
              placeholder="Min"
              value={payMin}
              onChange={(e) => setPayMin(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
            <input
              type="number"
              placeholder="Max"
              value={payMax}
              onChange={(e) => setPayMax(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
            <select
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value as "year" | "hour")}
              className="rounded-lg border px-3 py-2"
            >
              <option value="year">Per year</option>
              <option value="hour">Per hour</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <legend className="font-display font-bold text-brand-700">How to apply</legend>
          <input
            type="url"
            placeholder="Application URL"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            type="email"
            placeholder="Or application email"
            value={applyEmail}
            onChange={(e) => setApplyEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold">Your work email *</span>
          <input
            type="email"
            required
            value={employerEmail}
            onChange={(e) => setEmployerEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-4 font-display text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Redirecting to secure checkout…" : "Continue to payment"}
        </button>
        <p className="text-center text-xs text-muted">
          Payments are processed by Stripe. Card details never touch our servers.
        </p>
        <p className="text-center text-sm font-semibold text-brand-600">
          <Link to="/login">Already have an account? Sign in</Link>
        </p>
      </form>
    </div>
  );
}

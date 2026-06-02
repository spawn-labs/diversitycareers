import { Link } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";

export function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-700 px-4 py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 size-48 rounded-full bg-brand-100/20 blur-2xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-100">
            DEI-first hiring
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Find careers where{" "}
            <span className="text-accent-400">diversity</span> is the mission
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-50/90">
            Search inclusive roles across the U.S. — or post your opening and reach candidates who
            care about belonging.
          </p>
        </div>
        <div className="relative mx-auto mt-10 max-w-4xl rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <SearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <span className="text-3xl" aria-hidden>
              🔍
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-brand-700">For job seekers</h2>
            <p className="mt-2 text-muted">
              Keyword and location search, filters by category, state, pay, and remote work — apply
              in a click.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-block font-bold text-brand-600 hover:text-brand-700"
            >
              Browse all jobs →
            </Link>
          </div>
          <div className="rounded-3xl border-2 border-accent-500/30 bg-gradient-to-br from-white to-orange-50 p-8 shadow-sm">
            <span className="text-3xl" aria-hidden>
              ✨
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold text-brand-700">For employers</h2>
            <p className="mt-2 text-muted">
              Pay securely via Stripe before your listing goes live. Manage posts and applications
              from your dashboard.
            </p>
            <Link
              to="/employer/post"
              className="mt-4 inline-block rounded-xl bg-accent-500 px-5 py-2.5 font-display font-bold text-white hover:bg-accent-400"
            >
              Post a job now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

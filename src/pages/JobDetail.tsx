import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { getJob, submitApplication, type Job, formatLocation, formatPay } from "../lib/api";

export function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formLoadedAt] = useState(() => Date.now());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then((d) => setJob(d.job))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load job"));
  }, [id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      await submitApplication({
        jobId: id,
        name,
        email,
        phone,
        message,
        formLoadedAt,
        website_url: "",
      });
      setSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Application failed");
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ErrorAlert message={error} />
        <Link to="/jobs" className="mt-4 inline-block text-brand-600">
          ← Back to search
        </Link>
      </div>
    );
  }

  if (!job) return <p className="p-8 text-center text-muted">Loading…</p>;

  const pay = formatPay(job);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/jobs" className="text-sm font-semibold text-brand-600">
        ← Back to results
      </Link>
      <header className="mt-4">
        <h1 className="font-display text-3xl font-extrabold text-brand-700">{job.title}</h1>
        <p className="mt-1 text-xl font-semibold text-muted">{job.company}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <span className="rounded-md bg-brand-50 px-3 py-1 text-brand-700">
            {formatLocation(job)}
          </span>
          {pay && (
            <span className="rounded-md bg-stone-100 px-3 py-1">{pay}</span>
          )}
          <span className="rounded-md bg-stone-100 px-3 py-1">{job.category}</span>
        </div>
      </header>

      <div className="prose prose-stone mt-8 max-w-none">
        <p className="whitespace-pre-wrap text-stone-700">{job.description}</p>
      </div>

      {job.applyUrl && (
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700"
        >
          Apply on company site
        </a>
      )}

      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl font-bold text-brand-700">Quick apply</h2>
        {success ? (
          <p className="mt-4 text-brand-700">Thanks! Your application was submitted.</p>
        ) : (
          <form onSubmit={apply} className="mt-4 space-y-4">
            <ErrorAlert message={formError} />
            <input
              type="text"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] opacity-0"
              aria-hidden
            />
            <label className="block">
              <span className="text-sm font-semibold">Full name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Phone (optional)</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Message (optional)</span>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-accent-500 px-6 py-3 font-display font-bold text-white hover:bg-accent-400"
            >
              Submit application
            </button>
          </form>
        )}
      </section>
    </article>
  );
}

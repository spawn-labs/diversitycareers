import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { buildApplyMailto } from "../lib/apply";
import { getJob, type Job, formatLocation, formatPay } from "../lib/api";

export function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getJob(id)
      .then((d) => setJob(d.job))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load job"));
  }, [id]);

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
  const hasUrl = Boolean(job.applyUrl);
  const hasEmail = Boolean(job.applyEmail);

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
          {pay && <span className="rounded-md bg-stone-100 px-3 py-1">{pay}</span>}
          <span className="rounded-md bg-stone-100 px-3 py-1">{job.category}</span>
        </div>
      </header>

      <div className="prose prose-stone mt-8 max-w-none">
        <p className="whitespace-pre-wrap text-stone-700">{job.description}</p>
      </div>

      {(hasUrl || hasEmail) && (
        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-brand-700">Apply for this role</h2>
          <p className="mt-2 text-sm text-muted">
            {hasEmail && hasUrl
              ? "Apply by email or visit the company's application page."
              : hasEmail
                ? "Click below to open your email app and send your application directly to the employer."
                : "Continue to the company's application page."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {hasEmail && (
              <a
                href={buildApplyMailto({
                  title: job.title,
                  company: job.company,
                  applyEmail: job.applyEmail!,
                })}
                className="inline-block rounded-xl bg-accent-500 px-6 py-3 font-display font-bold text-white hover:bg-accent-400"
              >
                Apply by email
              </a>
            )}
            {hasUrl && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl bg-brand-600 px-6 py-3 font-bold text-white hover:bg-brand-700"
              >
                Apply on company site
              </a>
            )}
          </div>
        </section>
      )}
    </article>
  );
}

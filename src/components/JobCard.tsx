import { Link } from "react-router-dom";
import type { Job } from "../lib/api";
import { formatLocation, formatPay } from "../lib/api";

export function JobCard({ job }: { job: Job }) {
  const pay = formatPay(job);
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold text-brand-700">{job.title}</h3>
          <p className="font-semibold text-muted">{job.company}</p>
        </div>
        {pay && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
            {pay}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-stone-600">{job.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
          {formatLocation(job)}
        </span>
        <span className="rounded-md bg-accent-500/10 px-2 py-1 text-accent-500">
          {job.category}
        </span>
        <span className="rounded-md bg-stone-100 px-2 py-1 capitalize text-stone-700">
          {job.employmentType.replace("-", " ")}
        </span>
      </div>
    </Link>
  );
}

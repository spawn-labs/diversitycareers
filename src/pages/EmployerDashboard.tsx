import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { ListingDurationNotice } from "../components/ListingDurationNotice";
import { employerJobs, formatLocation, type Job } from "../lib/api";
import { daysRemaining, formatExpiryDate } from "../lib/listing";

export function EmployerDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    employerJobs()
      .then((d) => setJobs(d.jobs))
      .catch((e) => {
        if (String(e).includes("401") || (e instanceof Error && e.message.includes("Login"))) {
          navigate("/login");
        } else {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      });
  }, [navigate]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:px-6">
      <aside className="w-full shrink-0 rounded-2xl border border-stone-200 bg-white p-4 sm:w-56">
        <h2 className="font-display font-bold text-brand-700">Employer</h2>
        <nav className="mt-4 space-y-2 text-sm font-semibold">
          <span className="block rounded-lg bg-brand-50 px-3 py-2 text-brand-700">My jobs</span>
          <Link to="/employer/post" className="block rounded-lg px-3 py-2 hover:bg-stone-50">
            Post another job
          </Link>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-extrabold text-brand-700">Dashboard</h1>
        <div className="mt-4">
          <ListingDurationNotice />
        </div>
        <p className="mt-4 text-sm text-muted">
          Candidate applications are sent <strong>directly to the application email</strong> or URL
          you listed on each job — not stored here. Check your inbox or ATS for new applicants.
        </p>
        <ErrorAlert message={error} />

        <section className="mt-6">
          <h2 className="font-display text-xl font-bold">Your job posts</h2>
          {jobs.length === 0 ? (
            <p className="mt-2 text-muted">No jobs yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {jobs.map((job) => (
                <li key={job.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-brand-700">{job.title}</h3>
                      <p className="text-sm text-muted">
                        {formatLocation(job)} · {job.status}
                        {job.status === "published" && (
                          <>
                            {" "}
                            · Expires {formatExpiryDate(job.expiresAt)}
                            {daysRemaining(job.expiresAt, job.paidAt, job.createdAt) != null && (
                              <>
                                {" "}
                                ({daysRemaining(job.expiresAt, job.paidAt, job.createdAt)} days
                                left)
                              </>
                            )}
                          </>
                        )}
                      </p>
                      {job.applyEmail && (
                        <p className="mt-1 text-xs text-muted">
                          Applications emailed to: {job.applyEmail}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-brand-600"
                    >
                      View listing
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

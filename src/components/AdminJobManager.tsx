import { useCallback, useEffect, useState } from "react";
import {
  adminCreateJob,
  adminDeleteJob,
  adminImportFile,
  adminListJobs,
  adminUpdateJob,
  type Job,
} from "../lib/api";
import { formatExpiryDate, daysRemaining } from "../lib/listing";
import { ErrorAlert } from "./ErrorAlert";

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

const emptyForm = (): Partial<Job> => ({
  title: "",
  company: "",
  description: "",
  category: "General",
  employmentType: "full-time",
  location: { remote: false },
  employerEmail: "admin@diversitycareers.local",
  status: "published",
});

export function AdminJobManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    adminListJobs()
      .then((d) => setJobs(d.jobs))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load jobs"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const content = await file.text();
      const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
      const res = await adminImportFile({ format, content });
      setMessage(`Imported ${res.imported} of ${res.totalRows} rows from ${file.name}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.title || !editing.company || !editing.description) {
      setError("Title, company, and description are required.");
      return;
    }
    setError(null);
    try {
      if (isNew) {
        await adminCreateJob(editing);
        setMessage("Job created.");
      } else if (editing.id) {
        await adminUpdateJob(editing.id, editing);
        setMessage("Job updated.");
      }
      setEditing(null);
      setIsNew(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function removeJob(id: string) {
    if (!confirm("Delete this job and its applications?")) return;
    setError(null);
    try {
      await adminDeleteJob(id);
      setMessage("Job deleted.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-display text-lg font-bold">Import jobs (CSV or JSON)</h2>
        <p className="mt-1 text-sm text-muted">
          CSV header row required. Columns: title, company, description, category, city, state,
          zip, remote, employmentType, payMin, payMax, payPeriod, applyUrl, applyEmail,
          employerEmail. URLs may omit https://.
        </p>
        <p className="mt-1 text-xs text-muted">
          See <code>data/sample-import.csv</code> in the repo for an example.
        </p>
        <label className="mt-4 inline-block cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          {uploading ? "Uploading…" : "Choose CSV or JSON file"}
          <input
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="hidden"
            disabled={uploading}
            onChange={handleFileUpload}
          />
        </label>
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Manage all jobs ({jobs.length})</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(emptyForm());
              setIsNew(true);
            }}
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-white"
          >
            Add job
          </button>
        </div>

        <ErrorAlert message={error} />
        {message && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {message}
          </div>
        )}

        {editing && (
          <form onSubmit={saveJob} className="mt-6 space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <h3 className="font-bold text-brand-700">{isNew ? "New job" : "Edit job"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Title *"
                required
                value={editing.title ?? ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="Company *"
                required
                value={editing.company ?? ""}
                onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="Employer email"
                value={editing.employerEmail ?? ""}
                onChange={(e) => setEditing({ ...editing, employerEmail: e.target.value })}
                className="rounded-lg border px-3 py-2 sm:col-span-2"
              />
              <select
                value={editing.category ?? "General"}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={editing.status ?? "published"}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className="rounded-lg border px-3 py-2"
              >
                <option value="published">published</option>
                <option value="expired">expired</option>
                <option value="draft">draft</option>
              </select>
            </div>
            <textarea
              placeholder="Description *"
              required
              rows={4}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                placeholder="City"
                value={editing.location?.city ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    location: { ...editing.location!, remote: editing.location?.remote ?? false, city: e.target.value },
                  })
                }
                className="rounded-lg border px-3 py-2"
              />
              <input
                placeholder="State"
                value={editing.location?.state ?? ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    location: { ...editing.location!, remote: editing.location?.remote ?? false, state: e.target.value },
                  })
                }
                className="rounded-lg border px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={editing.location?.remote ?? false}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      location: { ...editing.location!, remote: e.target.checked },
                    })
                  }
                />
                Remote
              </label>
            </div>
            <input
              placeholder="Application URL (https optional)"
              value={editing.applyUrl ?? ""}
              onChange={(e) => setEditing({ ...editing, applyUrl: e.target.value })}
              className="w-full rounded-lg border px-3 py-2"
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-stone-50 font-semibold">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Company</th>
                <th className="p-2">Status</th>
                <th className="p-2">Expires</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const left = daysRemaining(job.expiresAt, job.paidAt, job.createdAt);
                return (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{job.title}</td>
                    <td className="p-2">{job.company}</td>
                    <td className="p-2 capitalize">{job.status}</td>
                    <td className="p-2 text-xs">
                      {formatExpiryDate(job.expiresAt)}
                      {left != null && job.status === "published" && (
                        <span className="block text-muted">{left}d left</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ ...job });
                            setIsNew(false);
                          }}
                          className="text-brand-600 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeJob(job.id)}
                          className="text-red-600 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

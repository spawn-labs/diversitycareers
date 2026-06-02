import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import seedJobs from "../../data/seed-jobs.json";
import { ErrorAlert } from "../components/ErrorAlert";
import { addSource, adminSources, crawlSource, importSeed } from "../lib/api";

export function Admin() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<
    { id: string; name: string; url: string; type: string; enabled: boolean }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"rss" | "json">("json");

  function load() {
    adminSources()
      .then((d) => setSources(d.sources))
      .catch(() => navigate("/login"));
  }

  useEffect(() => {
    load();
  }, [navigate]);

  async function handleImportSeed() {
    setError(null);
    setMessage(null);
    try {
      const res = await importSeed(seedJobs);
      setMessage(`Imported ${res.imported} seed jobs.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addSource({ name, url, type });
      setName("");
      setUrl("");
      load();
      setMessage("Source added.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleCrawl(id: string) {
    setError(null);
    try {
      const res = await crawlSource(id);
      setMessage(`Crawled and imported ${res.imported} jobs.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Crawl failed");
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:px-6">
      <aside className="w-full shrink-0 rounded-2xl border border-stone-200 bg-white p-4 sm:w-56">
        <h2 className="font-display font-bold text-brand-700">Admin</h2>
        <p className="mt-2 text-xs text-muted">Job sources & seed data</p>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-extrabold text-brand-700">Admin panel</h1>
        <ErrorAlert message={error} />
        {message && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {message}
          </div>
        )}

        <section className="mt-8 rounded-2xl border bg-white p-5">
          <h2 className="font-display text-lg font-bold">Seed jobs</h2>
          <p className="mt-1 text-sm text-muted">
            Load sample listings from <code className="text-xs">data/seed-jobs.json</code> to
            populate the board for testing.
          </p>
          <button
            type="button"
            onClick={handleImportSeed}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"
          >
            Import seed jobs
          </button>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5">
          <h2 className="font-display text-lg font-bold">Crawl sources</h2>
          <form onSubmit={handleAddSource} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Source name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border px-3 py-2"
            />
            <input
              placeholder="Feed URL (RSS or JSON)"
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-lg border px-3 py-2 sm:col-span-2"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "rss" | "json")}
              className="rounded-lg border px-3 py-2"
            >
              <option value="json">JSON feed</option>
              <option value="rss">RSS feed</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-accent-500 px-4 py-2 font-bold text-white"
            >
              Add source
            </button>
          </form>

          <ul className="mt-6 space-y-3">
            {sources.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-bold">{s.name}</p>
                  <p className="text-xs text-muted break-all">{s.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCrawl(s.id)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-bold text-white"
                >
                  Crawl now
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

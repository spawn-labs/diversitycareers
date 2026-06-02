import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) {
      if (/^\d{5}/.test(location.trim())) params.set("zip", location.trim());
      else if (location.includes(",")) {
        const [city, state] = location.split(",").map((s) => s.trim());
        if (city) params.set("city", city);
        if (state) params.set("state", state);
      } else params.set("city", location.trim());
    }
    if (remote) params.set("remote", "true");
    navigate(`/jobs?${params}`);
  }

  return (
    <form
      onSubmit={submit}
      className={`flex w-full flex-col gap-3 ${compact ? "" : "sm:flex-row sm:items-end"}`}
    >
      <label className="flex-1">
        <span className="mb-1 block text-sm font-semibold text-muted">Keywords</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Job title, skills, company…"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <label className="flex-1">
        <span className="mb-1 block text-sm font-semibold text-muted">Location</span>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, state, or ZIP"
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <label className="flex items-center gap-2 pb-1 sm:pb-3">
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
          className="size-4 rounded border-stone-300 text-brand-600"
        />
        <span className="text-sm font-semibold text-muted">Remote only</span>
      </label>
      <button
        type="submit"
        className="rounded-xl bg-brand-600 px-6 py-3 font-display font-bold text-white shadow-md hover:bg-brand-700"
      >
        Search Jobs
      </button>
    </form>
  );
}

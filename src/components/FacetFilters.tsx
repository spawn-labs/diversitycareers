import { useSearchParams } from "react-router-dom";
import type { SearchFacets } from "../lib/api";

interface FacetFiltersProps {
  facets: SearchFacets;
  categories: string[];
}

export function FacetFilters({ facets, categories }: FacetFiltersProps) {
  const [params, setParams] = useSearchParams();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const activeCategory = params.get("category");
  const activeState = params.get("state");
  const activeType = params.get("employmentType");
  const remoteOnly = params.get("remote") === "true";

  return (
    <aside className="space-y-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="font-display text-lg font-bold text-brand-700">Refine search</h2>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Remote</h3>
        <button
          type="button"
          onClick={() => set("remote", remoteOnly ? null : "true")}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
            remoteOnly ? "bg-brand-600 text-white" : "bg-stone-50 hover:bg-brand-50"
          }`}
        >
          Remote ({facets.remoteCount})
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Category</h3>
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {categories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => set("category", activeCategory === cat ? null : cat)}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                  activeCategory === cat
                    ? "bg-brand-600 text-white"
                    : "hover:bg-brand-50"
                }`}
              >
                {cat} ({facets.categories[cat] ?? 0})
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">State</h3>
        <ul className="max-h-36 space-y-1 overflow-y-auto">
          {Object.entries(facets.states)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([state, count]) => (
              <li key={state}>
                <button
                  type="button"
                  onClick={() => set("state", activeState === state ? null : state)}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                    activeState === state
                      ? "bg-brand-600 text-white"
                      : "hover:bg-brand-50"
                  }`}
                >
                  {state} ({count})
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Job type</h3>
        <ul className="space-y-1">
          {Object.entries(facets.types).map(([type, count]) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => set("employmentType", activeType === type ? null : type)}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm capitalize ${
                  activeType === type
                    ? "bg-brand-600 text-white"
                    : "hover:bg-brand-50"
                }`}
              >
                {type.replace("-", " ")} ({count})
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ErrorAlert } from "../components/ErrorAlert";
import { FacetFilters } from "../components/FacetFilters";
import { JobCard } from "../components/JobCard";
import { SearchBar } from "../components/SearchBar";
import { searchJobs, type Job, type SearchFacets } from "../lib/api";

export function Jobs() {
  const [params] = useSearchParams();
  const [results, setResults] = useState<Job[]>([]);
  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    searchJobs(params)
      .then((data) => {
        setResults(data.results);
        setFacets(data.facets);
        setCategories(data.categories);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Search failed"))
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold text-brand-700">Job search</h1>
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
        <SearchBar compact />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {facets && <FacetFilters facets={facets} categories={categories} />}
        <div>
          <ErrorAlert message={error} />
          {loading ? (
            <p className="text-muted">Loading jobs…</p>
          ) : results.length === 0 ? (
            <p className="rounded-xl bg-stone-100 p-6 text-center text-muted">
              No jobs match your search. Try different keywords or filters.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm font-semibold text-muted">
                {results.length} job{results.length !== 1 ? "s" : ""} found
              </p>
              <ul className="space-y-4">
                {results.map((job) => (
                  <li key={job.id}>
                    <JobCard job={job} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

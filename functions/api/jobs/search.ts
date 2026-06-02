import { jsonResponse } from "../../lib/auth";
import { facetCounts, searchJobs } from "../../lib/search";
import { readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const params = {
    q: url.searchParams.get("q") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    zip: url.searchParams.get("zip") ?? undefined,
    remote: url.searchParams.get("remote") === "true" ? true : undefined,
    category: url.searchParams.get("category") ?? undefined,
    employmentType: url.searchParams.get("employmentType") ?? undefined,
    payMin: url.searchParams.get("payMin")
      ? Number(url.searchParams.get("payMin"))
      : undefined,
  };

  const store = await readStore(context.env.DC_DATA);
  const results = searchJobs(store.jobs, params);
  const published = store.jobs.filter((j) => j.status === "published");
  const facets = facetCounts(
    searchJobs(store.jobs, {
      q: params.q,
      city: params.city,
      state: params.state,
      zip: params.zip,
    }),
  );

  return jsonResponse({
    results,
    total: results.length,
    facets,
    categories: [...new Set(published.map((j) => j.category))].sort(),
  });
};

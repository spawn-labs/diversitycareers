import { jsonResponse } from "../../lib/auth";
import { expireStaleJobs, isJobListed } from "../../lib/jobs";
import { facetCounts, searchJobs } from "../../lib/search";
import { mutateStore, readStore } from "../../lib/store";

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

  await mutateStore(context.env.DC_DATA, (s) => {
    expireStaleJobs(s.jobs);
  });

  const store = await readStore(context.env.DC_DATA);
  const results = searchJobs(store.jobs, params);
  const facets = facetCounts(
    searchJobs(store.jobs, {
      q: params.q,
      city: params.city,
      state: params.state,
      zip: params.zip,
    }),
  );

  const listed = store.jobs.filter((j) => isJobListed(j));

  return jsonResponse({
    results,
    total: results.length,
    facets,
    categories: [...new Set(listed.map((j) => j.category))].sort(),
  });
};

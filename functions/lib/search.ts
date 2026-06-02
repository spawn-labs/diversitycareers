import type { Job, JobLocation } from "./types";

export interface SearchParams {
  q?: string;
  city?: string;
  state?: string;
  zip?: string;
  remote?: boolean;
  category?: string;
  employmentType?: string;
  payMin?: number;
  /** miles from zip/city center — simplified: same state match gets partial score */
  radiusMiles?: number;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchesKeyword(job: Job, q: string): boolean {
  const needle = normalize(q);
  const hay = [
    job.title,
    job.company,
    job.description,
    job.category,
    job.location.city,
    job.location.state,
    job.location.zip,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

function locationMatch(job: Job, params: SearchParams): boolean {
  if (params.remote === true && !job.location.remote) return false;
  if (params.city && job.location.city) {
    if (normalize(job.location.city) !== normalize(params.city)) return false;
  }
  if (params.state && job.location.state) {
    if (normalize(job.location.state) !== normalize(params.state)) return false;
  }
  if (params.zip && job.location.zip) {
    if (job.location.zip.slice(0, 5) !== params.zip.slice(0, 5)) return false;
  }
  return true;
}

export function searchJobs(jobs: Job[], params: SearchParams): Job[] {
  return jobs
    .filter((j) => j.status === "published")
    .filter((j) => {
      if (params.q && !matchesKeyword(j, params.q)) return false;
      if (!locationMatch(j, params)) return false;
      if (params.category && normalize(j.category) !== normalize(params.category))
        return false;
      if (
        params.employmentType &&
        j.employmentType !== params.employmentType
      )
        return false;
      if (params.payMin != null && (j.payMax ?? j.payMin ?? 0) < params.payMin) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function facetCounts(jobs: Job[]) {
  const categories: Record<string, number> = {};
  const states: Record<string, number> = {};
  const types: Record<string, number> = {};
  let remoteCount = 0;

  for (const job of jobs) {
    categories[job.category] = (categories[job.category] ?? 0) + 1;
    if (job.location.state) {
      states[job.location.state] = (states[job.location.state] ?? 0) + 1;
    }
    types[job.employmentType] = (types[job.employmentType] ?? 0) + 1;
    if (job.location.remote) remoteCount++;
  }

  return { categories, states, types, remoteCount };
}

export function formatLocation(loc: JobLocation): string {
  if (loc.remote) return "Remote";
  const parts = [loc.city, loc.state].filter(Boolean);
  if (loc.zip) parts.push(loc.zip);
  return parts.join(", ") || "Location TBD";
}

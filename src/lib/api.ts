export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    zip?: string;
    remote: boolean;
  };
  category: string;
  payMin?: number;
  payMax?: number;
  payPeriod?: "hour" | "year";
  employmentType: string;
  applyUrl?: string;
  applyEmail?: string;
  status: string;
  paidAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
  employerEmail?: string;
}

export interface SearchFacets {
  categories: Record<string, number>;
  states: Record<string, number>;
  types: Record<string, number>;
  remoteCount: number;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const contentType = res.headers.get("Content-Type") ?? "";
  const bodyText = await res.text();
  const isJson = contentType.includes("application/json");

  let data: (T & { error?: string }) | null = null;
  if (isJson && bodyText) {
    try {
      data = JSON.parse(bodyText) as T & { error?: string };
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const details = data?.error ?? bodyText.slice(0, 180).replace(/\s+/g, " ").trim();
    throw new Error(details || `Request failed (${res.status})`);
  }

  if (!data) {
    throw new Error(
      `Unexpected response format from ${path}. Expected JSON but got ${contentType || "unknown content type"}.`,
    );
  }

  return data;
}

export function searchJobs(params: URLSearchParams) {
  return api<{
    results: Job[];
    total: number;
    facets: SearchFacets;
    categories: string[];
  }>(`/api/jobs/search?${params}`);
}

export function getJob(id: string) {
  return api<{ job: Job }>(`/api/jobs/${id}`);
}

export function submitApplication(body: Record<string, unknown>) {
  return api<{ ok: boolean; message: string }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function authMe() {
  return api<{
    authenticated: boolean;
    email?: string;
    role?: string;
    companyName?: string;
  }>("/api/auth/me");
}

export function login(body: { email: string; password: string; formLoadedAt: number }) {
  return api<{ ok: boolean }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ ...body, website_url: "" }),
  });
}

export function register(body: {
  email: string;
  password: string;
  companyName?: string;
  formLoadedAt: number;
}) {
  return api<{ ok: boolean }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...body, website_url: "" }),
  });
}

export function logout() {
  return api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function createCheckout(draft: Record<string, unknown>, formLoadedAt: number) {
  return api<{ checkoutUrl: string; pendingId: string }>("/api/stripe/create-checkout", {
    method: "POST",
    body: JSON.stringify({ draft, formLoadedAt, website_url: "" }),
  });
}

export function checkoutStatus(sessionId: string) {
  return api<{
    paid: boolean;
    jobId?: string;
    employerEmail: string;
    job?: Job;
  }>(`/api/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}`);
}

export function employerJobs() {
  return api<{
    jobs: Job[];
    applications: { id: string; jobId: string; name: string; email: string; createdAt: string }[];
  }>("/api/employer/jobs");
}

export function linkJob(jobId: string) {
  return api<{ ok: boolean }>("/api/employer/link-job", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
}

export function adminSources() {
  return api<{ sources: { id: string; name: string; url: string; type: string; enabled: boolean }[] }>(
    "/api/admin/sources",
  );
}

export function addSource(body: { name: string; url: string; type: "rss" | "json" }) {
  return api<{ source: unknown }>("/api/admin/sources", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function crawlSource(sourceId: string) {
  return api<{ imported: number }>("/api/admin/crawl", {
    method: "POST",
    body: JSON.stringify({ sourceId }),
  });
}

export function importSeed(jobs: unknown[]) {
  return api<{ imported: number }>("/api/admin/import-seed", {
    method: "POST",
    body: JSON.stringify({ jobs }),
  });
}

export function adminImportFile(body: { format: "csv" | "json"; content: string }) {
  return api<{ imported: number; totalRows: number }>("/api/admin/import-upload", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminListJobs() {
  return api<{ jobs: Job[] }>("/api/admin/jobs");
}

export function adminCreateJob(job: Partial<Job>) {
  return api<{ job: Job }>("/api/admin/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}

export function adminUpdateJob(id: string, job: Partial<Job>) {
  return api<{ job: Job }>(`/api/admin/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(job),
  });
}

export function adminDeleteJob(id: string) {
  return api<{ ok: boolean }>(`/api/admin/jobs/${id}`, { method: "DELETE" });
}

export function formatPay(job: Job): string | null {
  if (job.payMin == null && job.payMax == null) return null;
  const fmt = (n: number) =>
    job.payPeriod === "hour"
      ? `$${n}/hr`
      : `$${Math.round(n / 1000)}k`;
  if (job.payMin != null && job.payMax != null) {
    return `${fmt(job.payMin)} – ${fmt(job.payMax)}`;
  }
  return fmt((job.payMax ?? job.payMin)!);
}

export function formatLocation(job: Job): string {
  if (job.location.remote) return "Remote";
  const parts = [job.location.city, job.location.state].filter(Boolean);
  if (job.location.zip) parts.push(job.location.zip);
  return parts.join(", ") || "U.S.";
}

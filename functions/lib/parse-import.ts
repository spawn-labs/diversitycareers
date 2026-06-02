import type { EmploymentType, JobLocation } from "./types";

export interface ImportJobRow {
  title: string;
  company: string;
  description: string;
  location: JobLocation;
  category: string;
  employmentType: EmploymentType;
  payMin?: number;
  payMax?: number;
  payPeriod?: "hour" | "year";
  applyUrl?: string;
  applyEmail?: string;
  employerEmail: string;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function rowToJob(row: Record<string, string>): ImportJobRow | null {
  const title = row.title ?? row.job_title ?? "";
  const company = row.company ?? row.employer ?? "";
  if (!title || !company) return null;

  const remote =
    row.remote === "true" ||
    row.remote === "1" ||
    row.remote?.toLowerCase() === "yes";

  return {
    title,
    company,
    description: row.description ?? row.summary ?? "",
    location: {
      city: row.city || undefined,
      state: row.state || undefined,
      zip: row.zip || undefined,
      remote,
    },
    category: row.category || "General",
    employmentType: (row.employmenttype ||
      row.employment_type ||
      "full-time") as EmploymentType,
    payMin: row.paymin || row.pay_min ? Number(row.paymin || row.pay_min) : undefined,
    payMax: row.paymax || row.pay_max ? Number(row.paymax || row.pay_max) : undefined,
    payPeriod: (row.payperiod || row.pay_period) as "hour" | "year" | undefined,
    applyUrl: row.applyurl || row.apply_url || row.url || undefined,
    applyEmail: row.applyemail || row.apply_email || undefined,
    employerEmail:
      row.employeremail || row.employer_email || "seed@diversitycareers.local",
  };
}

export function parseCsvJobs(text: string): ImportJobRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const jobs: ImportJobRow[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    const job = rowToJob(row);
    if (job) jobs.push(job);
  }

  return jobs;
}

export function parseJsonJobs(text: string): ImportJobRow[] {
  const data = JSON.parse(text) as unknown;
  const list = Array.isArray(data)
    ? data
    : (data as { jobs?: unknown[] })?.jobs ?? [];

  const jobs: ImportJobRow[] = [];
  for (const item of list) {
    const o = item as Record<string, unknown>;
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" || typeof v === "number") {
        row[k.toLowerCase()] = String(v);
      }
    }
    if (o.location && typeof o.location === "object") {
      const loc = o.location as Record<string, unknown>;
      if (loc.city) row.city = String(loc.city);
      if (loc.state) row.state = String(loc.state);
      if (loc.zip) row.zip = String(loc.zip);
      if (loc.remote) row.remote = String(loc.remote);
    }
    const job = rowToJob(row);
    if (job) jobs.push(job);
  }
  return jobs;
}

import { newId } from "./store";
import type { CrawlSource, Job, JobDraft } from "./types";

/** Minimal RSS/JSON job import for admin seeding. */
export async function crawlSource(source: CrawlSource): Promise<JobDraft[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "DiversityCareersBot/1.0 (+https://diversitycareers.example)" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const text = await res.text();

  if (source.type === "json") {
    const data = JSON.parse(text) as unknown;
    return parseJsonFeed(data);
  }

  if (source.type === "rss") {
    return parseRss(text);
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

function parseJsonFeed(data: unknown): JobDraft[] {
  const list = Array.isArray(data)
    ? data
    : (data as { jobs?: unknown[] })?.jobs ?? [];
  return list.slice(0, 50).map((item) => jsonItemToDraft(item));
}

function jsonItemToDraft(item: unknown): JobDraft {
  const o = item as Record<string, unknown>;
  return {
    title: String(o.title ?? "Untitled Role"),
    company: String(o.company ?? o.employer ?? "Hiring Company"),
    description: String(o.description ?? o.summary ?? ""),
    location: {
      city: o.city ? String(o.city) : undefined,
      state: o.state ? String(o.state) : undefined,
      zip: o.zip ? String(o.zip) : undefined,
      remote: Boolean(o.remote),
    },
    category: String(o.category ?? "General"),
    employmentType: (o.employmentType as JobDraft["employmentType"]) ?? "full-time",
    applyUrl: o.applyUrl ? String(o.applyUrl) : o.url ? String(o.url) : undefined,
    employerEmail: String(o.employerEmail ?? "import@diversitycareers.local"),
  };
}

function parseRss(xml: string): JobDraft[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.slice(0, 30).map((m) => {
    const block = m[1];
    const title = tag(block, "title") ?? "Job Opening";
    const description = tag(block, "description") ?? "";
    const link = tag(block, "link");
    return {
      title: decodeXml(title),
      company: tag(block, "author") ?? "Employer",
      description: decodeXml(stripHtml(description)),
      location: { remote: /remote/i.test(description), },
      category: "Imported",
      employmentType: "full-time" as const,
      applyUrl: link ?? undefined,
      employerEmail: "import@diversitycareers.local",
    };
  });
}

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  return m?.[1]?.trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function draftsToPublishedJobs(
  drafts: JobDraft[],
  employerId?: string,
): Job[] {
  const now = new Date().toISOString();
  return drafts.map((d) => ({
    id: newId(),
    ...d,
    employerId,
    status: "published" as const,
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  }));
}

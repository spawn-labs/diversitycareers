import { newId } from "./store";
import type { EmploymentType, Job, JobDraft, JobLocation } from "./types";

export const JOB_LISTING_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Normalize application URL — accepts with or without https:// */
export function normalizeApplyUrl(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function listingExpiresAt(fromIso?: string): string {
  const base = fromIso ? new Date(fromIso).getTime() : Date.now();
  return new Date(base + JOB_LISTING_DAYS * MS_PER_DAY).toISOString();
}

export function getExpiresAt(job: Job): string {
  if (job.expiresAt) return job.expiresAt;
  return listingExpiresAt(job.paidAt ?? job.createdAt);
}

export function isJobListed(job: Job): boolean {
  if (job.status !== "published") return false;
  return new Date(getExpiresAt(job)).getTime() > Date.now();
}

/** Mark published jobs past expiry as expired (mutates store in place). */
export function expireStaleJobs(jobs: Job[]): void {
  const now = Date.now();
  for (const job of jobs) {
    if (job.status !== "published") continue;
    if (new Date(getExpiresAt(job)).getTime() <= now) {
      job.status = "expired";
      job.updatedAt = new Date().toISOString();
    }
  }
}

export function normalizeDraft(draft: JobDraft): JobDraft {
  return {
    ...draft,
    applyUrl: normalizeApplyUrl(draft.applyUrl),
  };
}

export function createPublishedJob(
  input: Partial<Job> & {
    title: string;
    company: string;
    description: string;
    employerEmail: string;
    location: JobLocation;
    category: string;
    employmentType: EmploymentType;
  },
  opts?: { paidAt?: string; id?: string },
): Job {
  const now = new Date().toISOString();
  const paidAt = opts?.paidAt ?? now;
  return {
    id: opts?.id ?? newId(),
    title: input.title,
    company: input.company,
    description: input.description,
    location: input.location,
    category: input.category,
    payMin: input.payMin,
    payMax: input.payMax,
    payPeriod: input.payPeriod,
    employmentType: input.employmentType,
    applyUrl: normalizeApplyUrl(input.applyUrl),
    applyEmail: input.applyEmail?.trim() || undefined,
    employerId: input.employerId,
    employerEmail: input.employerEmail,
    status: input.status === "expired" ? "expired" : "published",
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    paidAt,
    expiresAt: input.expiresAt ?? listingExpiresAt(paidAt),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

export function applyJobUpdates(existing: Job, patch: Partial<Job>): Job {
  const updated: Job = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    applyUrl: patch.applyUrl !== undefined ? normalizeApplyUrl(patch.applyUrl) : existing.applyUrl,
  };

  if (patch.expiresAt) {
    updated.expiresAt = patch.expiresAt;
  } else if (patch.paidAt) {
    updated.expiresAt = listingExpiresAt(patch.paidAt);
  } else if (!updated.expiresAt) {
    updated.expiresAt = listingExpiresAt(updated.paidAt ?? updated.createdAt);
  }

  if (updated.status === "published" && !isJobListed(updated)) {
    updated.status = "expired";
  }

  return updated;
}

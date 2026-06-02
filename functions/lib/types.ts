export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type JobStatus = "draft" | "pending_payment" | "published" | "expired";
export type UserRole = "employer" | "admin";

export interface JobLocation {
  city?: string;
  state?: string;
  zip?: string;
  remote: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: JobLocation;
  category: string;
  payMin?: number;
  payMax?: number;
  payPeriod?: "hour" | "year";
  employmentType: EmploymentType;
  applyUrl?: string;
  applyEmail?: string;
  employerId?: string;
  employerEmail: string;
  status: JobStatus;
  stripeCheckoutSessionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  companyName?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: string;
}

export interface JobDraft {
  title: string;
  company: string;
  description: string;
  location: JobLocation;
  category: string;
  payMin?: number;
  payMax?: number;
  payPeriod?: "hour" | "year";
  employmentType: EmploymentType;
  applyUrl?: string;
  applyEmail?: string;
  employerEmail: string;
}

export interface PendingCheckout {
  id: string;
  draft: JobDraft;
  employerEmail: string;
  stripeCheckoutSessionId: string;
  status: "pending" | "paid";
  jobId?: string;
  createdAt: string;
}

export interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "json" | "html";
  enabled: boolean;
  lastCrawledAt?: string;
}

export interface DataStore {
  jobs: Job[];
  users: User[];
  applications: Application[];
  pendingCheckouts: PendingCheckout[];
  crawlSources: CrawlSource[];
}

export const STORE_KEY = "dc:store:v1";

export function emptyStore(): DataStore {
  return {
    jobs: [],
    users: [],
    applications: [],
    pendingCheckouts: [],
    crawlSources: [],
  };
}

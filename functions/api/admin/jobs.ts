import { errorResponse, jsonResponse } from "../../lib/auth";
import { requireAdmin } from "../../lib/admin-auth";
import { createPublishedJob, expireStaleJobs } from "../../lib/jobs";
import { mutateStore, readStore } from "../../lib/store";
import type { EmploymentType, Job, JobLocation } from "../../lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  await mutateStore(context.env.DC_DATA, (s) => {
    expireStaleJobs(s.jobs);
  });

  const jobs = (await readStore(context.env.DC_DATA)).jobs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return jsonResponse({ jobs });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const body = (await context.request.json()) as Partial<Job>;
  if (!body.title || !body.company || !body.description) {
    return errorResponse("title, company, and description are required", 400);
  }

  const location = (body.location ?? { remote: false }) as JobLocation;
  const job = createPublishedJob({
    title: body.title,
    company: body.company,
    description: body.description,
    location,
    category: body.category ?? "General",
    employmentType: (body.employmentType ?? "full-time") as EmploymentType,
    payMin: body.payMin,
    payMax: body.payMax,
    payPeriod: body.payPeriod,
    applyUrl: body.applyUrl,
    applyEmail: body.applyEmail,
    employerEmail: body.employerEmail ?? "admin@diversitycareers.local",
    employerId: body.employerId,
    status: body.status === "expired" ? "expired" : "published",
    expiresAt: body.expiresAt,
  });

  await mutateStore(context.env.DC_DATA, (s) => {
    s.jobs.push(job);
  });

  return jsonResponse({ job }, { status: 201 });
};

import { errorResponse, jsonResponse } from "../../../lib/auth";
import { requireAdmin } from "../../../lib/admin-auth";
import { applyJobUpdates } from "../../../lib/jobs";
import { mutateStore, readStore } from "../../../lib/store";
import type { Job } from "../../../lib/types";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const id = context.params.id as string;
  const store = await readStore(context.env.DC_DATA);
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return errorResponse("Job not found", 404);
  return jsonResponse({ job });
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const id = context.params.id as string;
  const patch = (await context.request.json()) as Partial<Job>;

  let updated: Job | null = null;
  try {
    await mutateStore(context.env.DC_DATA, (s) => {
      const idx = s.jobs.findIndex((j) => j.id === id);
      if (idx < 0) throw new Error("NOT_FOUND");
      s.jobs[idx] = applyJobUpdates(s.jobs[idx], patch);
      updated = s.jobs[idx];
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return errorResponse("Job not found", 404);
    }
    throw e;
  }

  return jsonResponse({ job: updated });
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const id = context.params.id as string;
  let removed = false;

  await mutateStore(context.env.DC_DATA, (s) => {
    const before = s.jobs.length;
    s.jobs = s.jobs.filter((j) => j.id !== id);
    s.applications = s.applications.filter((a) => a.jobId !== id);
    removed = s.jobs.length < before;
  });

  if (!removed) return errorResponse("Job not found", 404);
  return jsonResponse({ ok: true });
};

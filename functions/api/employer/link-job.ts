import { errorResponse, getAuthSession, jsonResponse } from "../../lib/auth";
import { mutateStore } from "../../lib/store";

/** Attach paid job to employer account after registration/login post-checkout. */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session) return errorResponse("Login required", 401);

  const body = (await context.request.json()) as { jobId?: string };
  const jobId = String(body.jobId ?? "");
  if (!jobId) return errorResponse("jobId required", 400);

  let linked = false;
  await mutateStore(context.env.DC_DATA, (s) => {
    const job = s.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error("NOT_FOUND");
    if (job.employerEmail !== session.email) throw new Error("FORBIDDEN");
    job.employerId = session.userId;
    job.updatedAt = new Date().toISOString();
    linked = true;
  }).catch((e) => {
    if (e instanceof Error && e.message === "NOT_FOUND") return null;
    if (e instanceof Error && e.message === "FORBIDDEN") return "forbidden";
    throw e;
  });

  if (linked === "forbidden") return errorResponse("Not your job posting", 403);
  if (!linked) return errorResponse("Job not found", 404);

  return jsonResponse({ ok: true });
};

import { errorResponse, getAuthSession, jsonResponse } from "../../lib/auth";
import { expireStaleJobs } from "../../lib/jobs";
import { mutateStore, readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session) return errorResponse("Login required", 401);

  await mutateStore(context.env.DC_DATA, (s) => {
    expireStaleJobs(s.jobs);
  });

  const store = await readStore(context.env.DC_DATA);
  const jobs = store.jobs.filter(
    (j) => j.employerId === session.userId || j.employerEmail === session.email,
  );
  const applications = store.applications.filter((a) =>
    jobs.some((j) => j.id === a.jobId),
  );

  return jsonResponse({ jobs, applications });
};

import { errorResponse, getAuthSession, jsonResponse } from "../../lib/auth";
import { readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session) return errorResponse("Login required", 401);

  const store = await readStore(context.env.DC_DATA);
  const jobs = store.jobs.filter(
    (j) => j.employerId === session.userId || j.employerEmail === session.email,
  );
  const applications = store.applications.filter((a) =>
    jobs.some((j) => j.id === a.jobId),
  );

  return jsonResponse({ jobs, applications });
};

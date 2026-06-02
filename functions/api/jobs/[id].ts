import { errorResponse, jsonResponse } from "../../lib/auth";
import { expireStaleJobs, isJobListed } from "../../lib/jobs";
import { mutateStore, readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;

  await mutateStore(context.env.DC_DATA, (s) => {
    expireStaleJobs(s.jobs);
  });

  const store = await readStore(context.env.DC_DATA);
  const job = store.jobs.find((j) => j.id === id);
  if (!job || !isJobListed(job)) return errorResponse("Job not found", 404);
  return jsonResponse({ job });
};

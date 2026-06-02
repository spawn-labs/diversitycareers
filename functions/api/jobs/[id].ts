import { errorResponse, jsonResponse } from "../../lib/auth";
import { readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id as string;
  const store = await readStore(context.env.DC_DATA);
  const job = store.jobs.find((j) => j.id === id && j.status === "published");
  if (!job) return errorResponse("Job not found", 404);
  return jsonResponse({ job });
};

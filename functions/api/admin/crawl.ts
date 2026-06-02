import { errorResponse, getAuthSession, isAdminEmail, jsonResponse } from "../../lib/auth";
import { crawlSource, draftsToPublishedJobs } from "../../lib/crawl";
import { mutateStore, readStore } from "../../lib/store";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session || session.role !== "admin" || !isAdminEmail(session.email, context.env)) {
    return errorResponse("Admin access required", 403);
  }

  const body = (await context.request.json()) as { sourceId?: string };
  const sourceId = String(body.sourceId ?? "");

  const store = await readStore(context.env.DC_DATA);
  const source = store.crawlSources.find((s) => s.id === sourceId && s.enabled);
  if (!source) return errorResponse("Source not found", 404);

  let drafts;
  try {
    drafts = await crawlSource(source);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Crawl failed", 502);
  }

  const jobs = draftsToPublishedJobs(drafts);
  await mutateStore(context.env.DC_DATA, (s) => {
    s.jobs.push(...jobs);
    const src = s.crawlSources.find((x) => x.id === sourceId);
    if (src) src.lastCrawledAt = new Date().toISOString();
  });

  return jsonResponse({ imported: jobs.length, jobs });
};

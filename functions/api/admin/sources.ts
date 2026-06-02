import { errorResponse, getAuthSession, isAdminEmail, jsonResponse } from "../../lib/auth";
import { mutateStore, newId, readStore } from "../../lib/store";
import type { CrawlSource } from "../../lib/types";

async function requireAdmin(context: EventContext<Env, string, unknown>) {
  const session = await getAuthSession(context.request, context.env);
  if (!session || session.role !== "admin" || !isAdminEmail(session.email, context.env)) {
    return null;
  }
  return session;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context))) return errorResponse("Admin access required", 403);
  const store = await readStore(context.env.DC_DATA);
  return jsonResponse({ sources: store.crawlSources });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context))) return errorResponse("Admin access required", 403);

  const body = (await context.request.json()) as Partial<CrawlSource>;
  if (!body.name || !body.url || !body.type) {
    return errorResponse("name, url, and type (rss|json) required", 400);
  }

  const source: CrawlSource = {
    id: newId(),
    name: body.name,
    url: body.url,
    type: body.type === "json" ? "json" : "rss",
    enabled: body.enabled !== false,
  };

  await mutateStore(context.env.DC_DATA, (s) => {
    s.crawlSources.push(source);
  });

  return jsonResponse({ source });
};

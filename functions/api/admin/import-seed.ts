import { errorResponse, getAuthSession, isAdminEmail, jsonResponse } from "../../lib/auth";
import { mutateStore, newId } from "../../lib/store";
import type { Job } from "../../lib/types";

/** POST body: { jobs: Job[] } or import from bundled seed via GET */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session || session.role !== "admin" || !isAdminEmail(session.email, context.env)) {
    return errorResponse("Admin access required", 403);
  }

  const body = (await context.request.json()) as { jobs?: Partial<Job>[] };
  const incoming = body.jobs ?? [];
  if (!incoming.length) return errorResponse("No jobs provided", 400);

  const now = new Date().toISOString();
  let count = 0;

  await mutateStore(context.env.DC_DATA, (s) => {
    for (const raw of incoming) {
      if (!raw.title || !raw.company) continue;
      s.jobs.push({
        id: newId(),
        title: raw.title,
        company: raw.company,
        description: raw.description ?? "",
        location: raw.location ?? { remote: false },
        category: raw.category ?? "General",
        payMin: raw.payMin,
        payMax: raw.payMax,
        payPeriod: raw.payPeriod,
        employmentType: raw.employmentType ?? "full-time",
        applyUrl: raw.applyUrl,
        applyEmail: raw.applyEmail,
        employerEmail: raw.employerEmail ?? "seed@diversitycareers.local",
        status: "published",
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }
  });

  return jsonResponse({ imported: count });
};

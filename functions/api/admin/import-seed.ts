import { errorResponse, jsonResponse } from "../../lib/auth";
import { requireAdmin } from "../../lib/admin-auth";
import { createPublishedJob } from "../../lib/jobs";
import { mutateStore } from "../../lib/store";
import type { Job } from "../../lib/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const body = (await context.request.json()) as { jobs?: Partial<Job>[] };
  const incoming = body.jobs ?? [];
  if (!incoming.length) return errorResponse("No jobs provided", 400);

  let count = 0;

  await mutateStore(context.env.DC_DATA, (s) => {
    for (const raw of incoming) {
      if (!raw.title || !raw.company) continue;
      s.jobs.push(
        createPublishedJob({
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
        }),
      );
      count++;
    }
  });

  return jsonResponse({ imported: count });
};

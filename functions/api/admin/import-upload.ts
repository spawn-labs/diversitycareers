import { errorResponse, jsonResponse } from "../../lib/auth";
import { requireAdmin } from "../../lib/admin-auth";
import { createPublishedJob } from "../../lib/jobs";
import { parseCsvJobs, parseJsonJobs } from "../../lib/parse-import";
import { mutateStore } from "../../lib/store";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!(await requireAdmin(context.request, context.env))) {
    return errorResponse("Admin access required", 403);
  }

  const body = (await context.request.json()) as {
    format?: "csv" | "json";
    content?: string;
  };

  const format = body.format;
  const content = body.content?.trim();

  if (!format || !content) {
    return errorResponse("format (csv|json) and content are required", 400);
  }

  let rows;
  try {
    rows = format === "csv" ? parseCsvJobs(content) : parseJsonJobs(content);
  } catch {
    return errorResponse(`Invalid ${format.toUpperCase()} file`, 400);
  }

  if (!rows.length) {
    return errorResponse("No valid job rows found in file", 400);
  }

  let imported = 0;
  await mutateStore(context.env.DC_DATA, (s) => {
    for (const row of rows) {
      s.jobs.push(
        createPublishedJob({
          title: row.title,
          company: row.company,
          description: row.description,
          location: row.location,
          category: row.category,
          employmentType: row.employmentType,
          payMin: row.payMin,
          payMax: row.payMax,
          payPeriod: row.payPeriod,
          applyUrl: row.applyUrl,
          applyEmail: row.applyEmail,
          employerEmail: row.employerEmail,
        }),
      );
      imported++;
    }
  });

  return jsonResponse({ imported, totalRows: rows.length });
};

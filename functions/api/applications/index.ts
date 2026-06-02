import { errorResponse, jsonResponse } from "../../lib/auth";
import {
  checkRateLimit,
  checkSpamBasics,
  clientIp,
  defaultHoneypotField,
} from "../../lib/spam";
import { mutateStore, newId } from "../../lib/store";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ip = clientIp(context.request);
  const rateErr = await checkRateLimit(context.env.DC_DATA, ip);
  if (rateErr) return errorResponse(rateErr, 429);

  let body: Record<string, unknown>;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const honeypotField = defaultHoneypotField(context.env);
  const spamErr = checkSpamBasics(
    {
      clientIp: ip,
      formLoadedAt: body.formLoadedAt as number | undefined,
    },
    body[honeypotField] as string | undefined,
  );
  if (spamErr) return errorResponse(spamErr, 400);

  const jobId = String(body.jobId ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const message = body.message ? String(body.message).trim() : undefined;
  const phone = body.phone ? String(body.phone).trim() : undefined;

  if (!jobId || !name || !email || !email.includes("@")) {
    return errorResponse("Job, name, and valid email are required.", 400);
  }

  const store = await mutateStore(context.env.DC_DATA, (s) => {
    const job = s.jobs.find((j) => j.id === jobId && j.status === "published");
    if (!job) throw new Error("JOB_NOT_FOUND");
    s.applications.push({
      id: newId(),
      jobId,
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString(),
    });
  }).catch((e) => {
    if (e instanceof Error && e.message === "JOB_NOT_FOUND") return null;
    throw e;
  });

  if (!store) return errorResponse("Job not found", 404);

  return jsonResponse({ ok: true, message: "Application submitted successfully." });
};

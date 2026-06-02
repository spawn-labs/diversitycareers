import { errorResponse, jsonResponse } from "../../lib/auth";
import { readStore } from "../../lib/store";

/** Poll after Stripe redirect — job only exists once webhook marked paid. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sessionId = new URL(context.request.url).searchParams.get("session_id");
  if (!sessionId) return errorResponse("session_id required", 400);

  const store = await readStore(context.env.DC_DATA);
  const pending = store.pendingCheckouts.find(
    (p) => p.stripeCheckoutSessionId === sessionId,
  );
  if (!pending) return errorResponse("Checkout not found", 404);

  const job = pending.jobId
    ? store.jobs.find((j) => j.id === pending.jobId)
    : undefined;

  return jsonResponse({
    status: pending.status,
    paid: pending.status === "paid",
    jobId: pending.jobId,
    job,
    employerEmail: pending.employerEmail,
  });
};

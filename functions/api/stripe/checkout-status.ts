import { errorResponse, jsonResponse } from "../../lib/auth";
import { fulfillCheckoutIfPaid } from "../../lib/fulfill-checkout";
import { readStore } from "../../lib/store";

/** Poll after Stripe redirect; verifies with Stripe API if webhook has not run yet. */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sessionId = new URL(context.request.url).searchParams.get("session_id");
  if (!sessionId) return errorResponse("session_id required", 400);

  if (!context.env.STRIPE_SECRET_KEY?.startsWith("sk_")) {
    return errorResponse("Stripe is not configured on the server.", 503);
  }

  const result = await fulfillCheckoutIfPaid(
    context.env.DC_DATA,
    sessionId,
    context.env.STRIPE_SECRET_KEY,
  );

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
    fulfilledViaApi: result.fulfilled && pending.status === "paid",
  });
};

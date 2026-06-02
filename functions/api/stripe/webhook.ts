import { verifyWebhookSignature } from "../../lib/stripe";
import { mutateStore, newId } from "../../lib/store";
import type { Job } from "../../lib/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const signature = context.request.headers.get("Stripe-Signature") ?? "";
  const payload = await context.request.text();

  if (!context.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const valid = await verifyWebhookSignature(
    payload,
    signature,
    context.env.STRIPE_WEBHOOK_SECRET,
  );
  if (!valid) return new Response("Invalid signature", { status: 400 });

  const event = JSON.parse(payload) as {
    type: string;
    data: { object: { id: string; metadata?: Record<string, string> } };
  };

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data.object.id;
    const pendingId = event.data.object.metadata?.pending_id;

    await mutateStore(context.env.DC_DATA, (s) => {
      const pending = s.pendingCheckouts.find(
        (p) =>
          p.stripeCheckoutSessionId === sessionId ||
          (pendingId && p.id === pendingId),
      );
      if (!pending || pending.status === "paid") return;

      const now = new Date().toISOString();
      const job: Job = {
        id: newId(),
        ...pending.draft,
        status: "published",
        stripeCheckoutSessionId: sessionId,
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      };

      s.jobs.push(job);
      pending.status = "paid";
      pending.jobId = job.id;
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

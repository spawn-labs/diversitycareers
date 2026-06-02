import { fulfillCheckoutIfPaid } from "../../lib/fulfill-checkout";
import { verifyWebhookSignature } from "../../lib/stripe";

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
    data: { object: { id: string } };
  };

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data.object.id;
    if (context.env.STRIPE_SECRET_KEY?.startsWith("sk_")) {
      await fulfillCheckoutIfPaid(
        context.env.DC_DATA,
        sessionId,
        context.env.STRIPE_SECRET_KEY,
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

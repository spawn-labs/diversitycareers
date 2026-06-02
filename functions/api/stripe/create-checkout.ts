import { errorResponse, jsonResponse } from "../../lib/auth";
import { checkRateLimit, checkSpamBasics, clientIp, defaultHoneypotField } from "../../lib/spam";
import { createCheckoutSession } from "../../lib/stripe";
import { mutateStore, newId } from "../../lib/store";
import type { JobDraft } from "../../lib/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.STRIPE_SECRET_KEY?.startsWith("sk_")) {
    return errorResponse("Stripe is not configured on the server.", 503);
  }

  const ip = clientIp(context.request);
  const rateErr = await checkRateLimit(context.env.DC_DATA, ip);
  if (rateErr) return errorResponse(rateErr, 429);

  const body = (await context.request.json()) as Record<string, unknown>;
  const honeypotField = defaultHoneypotField(context.env);
  const spamErr = checkSpamBasics(
    { clientIp: ip, formLoadedAt: body.formLoadedAt as number | undefined },
    body[honeypotField] as string | undefined,
  );
  if (spamErr) return errorResponse(spamErr, 400);

  const draft = body.draft as JobDraft | undefined;
  if (!draft?.title || !draft.company || !draft.description || !draft.employerEmail) {
    return errorResponse("Complete job details before payment.", 400);
  }
  if (!draft.employerEmail.includes("@")) {
    return errorResponse("Valid employer email required.", 400);
  }

  const pendingId = newId();
  let checkoutUrl = "";

  await mutateStore(context.env.DC_DATA, async (s) => {
    const session = await createCheckoutSession(context.env, {
      employerEmail: draft.employerEmail,
      pendingId,
      successPath: "/employer/success",
      cancelPath: "/employer/post",
    });

    s.pendingCheckouts.push({
      id: pendingId,
      draft,
      employerEmail: draft.employerEmail,
      stripeCheckoutSessionId: session.id,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    checkoutUrl = session.url;
  });

  return jsonResponse({ checkoutUrl, pendingId });
};

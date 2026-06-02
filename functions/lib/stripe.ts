/** Stripe REST helpers — secret key stays server-side only. */

export async function stripeRequest<T>(
  secretKey: string,
  path: string,
  method: string,
  body?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };
  let fetchBody: string | undefined;
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    fetchBody = new URLSearchParams(body).toString();
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body: method === "GET" ? undefined : fetchBody,
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Stripe error ${res.status}`);
  }
  return data;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export interface StripeCheckoutSessionDetails {
  id: string;
  payment_status: string;
  status: string | null;
}

export async function getCheckoutSession(
  secretKey: string,
  sessionId: string,
): Promise<StripeCheckoutSessionDetails> {
  return stripeRequest<StripeCheckoutSessionDetails>(
    secretKey,
    `/checkout/sessions/${sessionId}`,
    "GET",
  );
}

export async function createCheckoutSession(
  env: Env,
  opts: {
    employerEmail: string;
    pendingId: string;
    successPath: string;
    cancelPath: string;
  },
): Promise<CheckoutSession> {
  const priceCents = env.JOB_POSTING_PRICE_CENTS ?? "9900";
  const appUrl = env.APP_URL.replace(/\/$/, "");

  const session = await stripeRequest<{ id: string; url: string }>(
    env.STRIPE_SECRET_KEY,
    "/checkout/sessions",
    "POST",
    {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": priceCents,
      "line_items[0][price_data][product_data][name]": "Diversity Careers Job Posting",
      "line_items[0][price_data][product_data][description]":
        "60-day featured job listing for diversity-focused hiring",
      "line_items[0][quantity]": "1",
      customer_email: opts.employerEmail,
      success_url: `${appUrl}${opts.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${opts.cancelPath}`,
      "metadata[pending_id]": opts.pendingId,
      "metadata[employer_email]": opts.employerEmail,
    },
  );

  return { id: session.id, url: session.url };
}

export async function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = signatureHeader.split(",").reduce(
    (acc, part) => {
      const [k, v] = part.split("=");
      if (k === "t") acc.t = v;
      if (k === "v1") acc.v1 = v;
      return acc;
    },
    { t: "", v1: "" } as { t: string; v1: string },
  );
  if (!parts.t || !parts.v1) return false;

  const signed = `${parts.t}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed));
  const expected = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, parts.v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

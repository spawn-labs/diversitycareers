const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;

export interface SpamCheckInput {
  honeypot?: string;
  formLoadedAt?: number;
  /** Client IP from CF-Connecting-IP */
  clientIp: string;
}

export function defaultHoneypotField(env: Env): string {
  return env.HONEYPOT_FIELD ?? "website_url";
}

/** Reject bots: filled honeypot or form submitted too fast (< 3s). */
export function checkSpamBasics(input: SpamCheckInput, honeypotFieldValue?: string): string | null {
  if (honeypotFieldValue && honeypotFieldValue.trim() !== "") {
    return "Submission blocked.";
  }
  if (input.formLoadedAt && Date.now() - input.formLoadedAt < 3000) {
    return "Please wait a moment before submitting.";
  }
  return null;
}

export async function checkRateLimit(kv: KVNamespace, clientIp: string): Promise<string | null> {
  const key = `rate:${clientIp}`;
  const raw = await kv.get(key);
  const now = Date.now();
  let count = 0;
  let windowStart = now;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { count: number; windowStart: number };
      if (now - parsed.windowStart < RATE_WINDOW_MS) {
        count = parsed.count;
        windowStart = parsed.windowStart;
      }
    } catch {
      /* reset */
    }
  }

  if (count >= MAX_REQUESTS_PER_WINDOW) {
    return "Too many requests. Please try again later.";
  }

  await kv.put(
    key,
    JSON.stringify({ count: count + 1, windowStart }),
    { expirationTtl: 120 },
  );
  return null;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

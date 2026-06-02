const COOKIE_NAME = "dc_session";
const MAX_AGE = 60 * 60 * 24 * 14;

export interface AuthSession {
  userId: string;
  email: string;
  role: "employer" | "admin";
  expiresAt: number;
}

function cookieFlags(request?: Request): string {
  const host = request ? new URL(request.url).hostname : "";
  const local =
    host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  return local
    ? "Path=/; HttpOnly; SameSite=Lax"
    : "Path=/; HttpOnly; Secure; SameSite=Lax";
}

function getSecret(env: Env): string {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET must be set (32+ random characters recommended)");
  }
  return env.SESSION_SECRET;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(data, secret);
  return expected === signature;
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const s = salt ?? btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(s),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return { hash, salt: s };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === expectedHash;
}

export async function setAuthCookie(
  payload: AuthSession,
  env: Env,
  request?: Request,
): Promise<string> {
  const body = btoa(JSON.stringify(payload));
  const sig = await sign(body, getSecret(env));
  const value = `${body}.${sig}`;
  return `${COOKIE_NAME}=${value}; ${cookieFlags(request)}; Max-Age=${MAX_AGE}`;
}

export async function getAuthSession(
  request: Request,
  env: Env,
): Promise<AuthSession | null> {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;

  const [body, sig] = match[1].split(".");
  if (!body || !sig) return null;

  try {
    const valid = await verify(body, sig, getSecret(env));
    if (!valid) return null;
    const payload = JSON.parse(atob(body)) as AuthSession;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function clearAuthCookie(request?: Request): string {
  return `${COOKIE_NAME}=; ${cookieFlags(request)}; Max-Age=0`;
}

export function isAdminEmail(email: string, env: Env): boolean {
  const list = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, { status });
}

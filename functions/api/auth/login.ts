import {
  errorResponse,
  jsonResponse,
  setAuthCookie,
  verifyPassword,
} from "../../lib/auth";
import { checkRateLimit, checkSpamBasics, clientIp, defaultHoneypotField } from "../../lib/spam";
import { readStore } from "../../lib/store";

export const onRequestPost: PagesFunction<Env> = async (context) => {
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

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const store = await readStore(context.env.DC_DATA);
  const user = store.users.find((u) => u.email === email);
  if (!user) return errorResponse("Invalid email or password.", 401);

  const valid = await verifyPassword(password, user.salt, user.passwordHash);
  if (!valid) return errorResponse("Invalid email or password.", 401);

  const cookie = await setAuthCookie(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    context.env,
    context.request,
  );

  return jsonResponse(
    { ok: true, email: user.email, role: user.role },
    { headers: { "Set-Cookie": cookie } },
  );
};

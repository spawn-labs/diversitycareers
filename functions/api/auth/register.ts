import {
  errorResponse,
  hashPassword,
  isAdminEmail,
  jsonResponse,
  setAuthCookie,
} from "../../lib/auth";
import { checkRateLimit, checkSpamBasics, clientIp, defaultHoneypotField } from "../../lib/spam";
import { mutateStore, newId } from "../../lib/store";

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
  const companyName = body.companyName ? String(body.companyName).trim() : undefined;

  if (!email.includes("@") || password.length < 8) {
    return errorResponse("Valid email and password (8+ characters) required.", 400);
  }

  let userId = "";
  try {
    await mutateStore(context.env.DC_DATA, async (s) => {
      if (s.users.some((u) => u.email === email)) {
        throw new Error("EMAIL_EXISTS");
      }
      const { hash, salt } = await hashPassword(password);
      userId = newId();
      s.users.push({
        id: userId,
        email,
        passwordHash: hash,
        salt,
        role: isAdminEmail(email, context.env) ? "admin" : "employer",
        companyName,
        createdAt: new Date().toISOString(),
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_EXISTS") {
      return errorResponse("An account with this email already exists.", 409);
    }
    throw e;
  }

  const cookie = await setAuthCookie(
    {
      userId,
      email,
      role: isAdminEmail(email, context.env) ? "admin" : "employer",
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    },
    context.env,
    context.request,
  );

  return jsonResponse(
    { ok: true, userId, email },
    { headers: { "Set-Cookie": cookie } },
  );
};

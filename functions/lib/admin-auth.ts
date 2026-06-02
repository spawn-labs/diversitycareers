import { getAuthSession, isAdminEmail } from "./auth";

export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<{ userId: string; email: string } | null> {
  const session = await getAuthSession(request, env);
  if (!session || session.role !== "admin" || !isAdminEmail(session.email, env)) {
    return null;
  }
  return { userId: session.userId, email: session.email };
}

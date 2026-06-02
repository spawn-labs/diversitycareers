import { getAuthSession, jsonResponse } from "../../lib/auth";
import { readStore } from "../../lib/store";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const session = await getAuthSession(context.request, context.env);
  if (!session) return jsonResponse({ authenticated: false });

  const store = await readStore(context.env.DC_DATA);
  const user = store.users.find((u) => u.id === session.userId);

  return jsonResponse({
    authenticated: true,
    email: session.email,
    role: session.role,
    companyName: user?.companyName,
  });
};

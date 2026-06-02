import { clearAuthCookie, jsonResponse } from "../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  return jsonResponse(
    { ok: true },
    { headers: { "Set-Cookie": clearAuthCookie(context.request) } },
  );
};

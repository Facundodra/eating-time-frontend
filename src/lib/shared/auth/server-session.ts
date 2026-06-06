import { cookies } from "next/headers";

import { getSessionFromCookieHeader } from "@/services/shared/auth-service";

import { BACKEND_SESSION_COOKIE_NAME } from "./session-cookies";

// Adaptador para Server Components/layouts:
// lee la cookie JSESSIONID de la request actual y delega en el service de auth,
// que valida la sesión contra GET /api/auth/me.
export async function getServerSession() {
  const cookieStore = await cookies();
  const backendSession = cookieStore.get(BACKEND_SESSION_COOKIE_NAME);

  if (!backendSession?.value) {
    return null;
  }

  return getSessionFromCookieHeader(
    `${BACKEND_SESSION_COOKIE_NAME}=${backendSession.value}`,
  );
}

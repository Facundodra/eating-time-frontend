import { NextResponse } from "next/server";

import { BACKEND_SESSION_COOKIE_NAME } from "@/lib/shared/auth/session-cookies";

const sessionCookiePattern = /(?:^|;\s*)JSESSIONID=([^;]+)/;

export function getBackendApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).replace(/\/$/, "");
}

export function extractBackendSessionId(setCookieHeader: string | null) {
  return setCookieHeader?.match(sessionCookiePattern)?.[1] ?? null;
}

export function setFrontendSessionCookie(
  response: NextResponse,
  sessionId: string,
) {
  response.cookies.set(BACKEND_SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function clearFrontendSessionCookie(response: NextResponse) {
  response.cookies.delete(BACKEND_SESSION_COOKIE_NAME);

  return response;
}

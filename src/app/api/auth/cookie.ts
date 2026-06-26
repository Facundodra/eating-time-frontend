import { NextResponse } from "next/server";

import {
  BACKEND_SESSION_COOKIE_NAME,
  LOGIN_CHANNEL_COOKIE_NAME,
} from "@/lib/shared/auth/session-cookies";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

const sessionCookiePattern = new RegExp(
  `(?:^|,\\s*|;\\s*)${BACKEND_SESSION_COOKIE_NAME}=([^;,]+)`,
  "i",
);

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

export function extractBackendSessionIdFromHeaders(headers: Headers) {
  const headersWithSetCookie = headers as HeadersWithSetCookie;
  const setCookieHeaders = headersWithSetCookie.getSetCookie?.() ?? [];
  const fallbackSetCookieHeader = headers.get("set-cookie");

  for (const setCookieHeader of setCookieHeaders) {
    const sessionId = extractBackendSessionId(setCookieHeader);
    if (sessionId) {
      return sessionId;
    }
  }

  return extractBackendSessionId(fallbackSetCookieHeader);
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

export function setFrontendLoginChannelCookie(response: NextResponse) {
  response.cookies.set(LOGIN_CHANNEL_COOKIE_NAME, "mobile-fallback", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function clearFrontendLoginChannelCookie(response: NextResponse) {
  response.cookies.delete(LOGIN_CHANNEL_COOKIE_NAME);

  return response;
}

export function clearFrontendSessionCookie(response: NextResponse) {
  response.cookies.delete(BACKEND_SESSION_COOKIE_NAME);

  return clearFrontendLoginChannelCookie(response);
}

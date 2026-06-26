import { NextRequest, NextResponse } from "next/server";

import {
  BACKEND_SESSION_COOKIE_NAME,
  LOGIN_CHANNEL_COOKIE_NAME,
} from "@/lib/shared/auth/session-cookies";

import {
  clearFrontendSessionCookie,
  getBackendApiBaseUrl,
} from "../cookie";

export async function POST(request: NextRequest) {
  const apiBaseUrl = getBackendApiBaseUrl();
  const sessionId = request.cookies.get(BACKEND_SESSION_COOKIE_NAME)?.value;
  const loginChannel = request.cookies.get(LOGIN_CHANNEL_COOKIE_NAME)?.value;
  const isMobileFallback = loginChannel === "mobile-fallback";

  if (apiBaseUrl && sessionId) {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: `${BACKEND_SESSION_COOKIE_NAME}=${sessionId}`,
      },
      body: JSON.stringify({ isMobile: isMobileFallback }),
    }).catch(() => null);
  }

  return clearFrontendSessionCookie(NextResponse.json({ ok: true }));
}

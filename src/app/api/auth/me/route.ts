import { NextRequest, NextResponse } from "next/server";

import { BACKEND_SESSION_COOKIE_NAME } from "@/lib/shared/auth/session-cookies";

import {
  clearFrontendSessionCookie,
  getBackendApiBaseUrl,
} from "../cookie";

export async function GET(request: NextRequest) {
  const apiBaseUrl = getBackendApiBaseUrl();
  const sessionId = request.cookies.get(BACKEND_SESSION_COOKIE_NAME)?.value;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "No esta configurada la URL del backend." },
      { status: 500 },
    );
  }

  if (!sessionId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      cookie: `${BACKEND_SESSION_COOKIE_NAME}=${sessionId}`,
    },
  });

  if (backendResponse.status === 401) {
    return clearFrontendSessionCookie(
      NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    );
  }

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await backendResponse.json()
    : await backendResponse.text();

  return NextResponse.json(data, { status: backendResponse.status });
}

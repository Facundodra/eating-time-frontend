import { NextRequest, NextResponse } from "next/server";

import {
  extractBackendSessionId,
  getBackendApiBaseUrl,
  setFrontendSessionCookie,
} from "../cookie";

export async function POST(request: NextRequest) {
  const apiBaseUrl = getBackendApiBaseUrl();

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "No esta configurada la URL del backend." },
      { status: 500 },
    );
  }

  const backendResponse = await fetch(`${apiBaseUrl}/api/auth/login-web`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: await request.text(),
  });

  const contentType = backendResponse.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await backendResponse.json()
    : await backendResponse.text();

  const response = NextResponse.json(data, { status: backendResponse.status });

  if (!backendResponse.ok) {
    return response;
  }

  const sessionId = extractBackendSessionId(
    backendResponse.headers.get("set-cookie"),
  );

  if (!sessionId) {
    return NextResponse.json(
      { message: "No se recibió la cookie de sesión del backend." },
      { status: 502 },
    );
  }

  return setFrontendSessionCookie(response, sessionId);
}

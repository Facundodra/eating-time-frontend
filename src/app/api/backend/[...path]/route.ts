import { NextRequest, NextResponse } from "next/server";

import { getBackendApiBaseUrl } from "@/app/api/auth/cookie";
import { BACKEND_SESSION_COOKIE_NAME } from "@/lib/shared/auth/session-cookies";

async function proxy(request: NextRequest) {
  const apiBaseUrl = getBackendApiBaseUrl();
  const sessionId = request.cookies.get(BACKEND_SESSION_COOKIE_NAME)?.value;

  const url = new URL(request.url);
  const backendPath = url.pathname.replace(/^\/api\/backend/, "");
  const backendUrl = `${apiBaseUrl}${backendPath}${url.search}`;

  const headers: Record<string, string> = {};
  if (sessionId) {
    headers["cookie"] = `${BACKEND_SESSION_COOKIE_NAME}=${sessionId}`;
  }
  const contentType = request.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const isBodyMethod = request.method !== "GET" && request.method !== "HEAD";
  const bodyBuffer = isBodyMethod ? await request.arrayBuffer() : undefined;

  const backendResponse = await fetch(backendUrl, {
    method: request.method,
    cache: "no-store",
    headers,
    body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
  });

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const responseContentType = backendResponse.headers.get("content-type") ?? "";
  if (responseContentType.includes("text/event-stream")) {
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "content-type": responseContentType,
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  }

  if (responseContentType.includes("application/json")) {
    return NextResponse.json(await backendResponse.json(), {
      status: backendResponse.status,
    });
  }

  return new NextResponse(await backendResponse.text(), {
    status: backendResponse.status,
    headers: { "content-type": responseContentType || "text/plain" },
  });
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE, proxy as PUT };

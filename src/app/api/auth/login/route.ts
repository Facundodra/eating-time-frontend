import { NextRequest, NextResponse } from "next/server";

import {
  clearFrontendLoginChannelCookie,
  extractBackendSessionIdFromHeaders,
  getBackendApiBaseUrl,
  setFrontendLoginChannelCookie,
  setFrontendSessionCookie,
} from "../cookie";

type ParsedLoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const apiBaseUrl = getBackendApiBaseUrl();
    const requestBody = await request.text();

    if (!apiBaseUrl) {
      return NextResponse.json(
        { message: "No esta configurada la URL del backend." },
        { status: 500 },
      );
    }

    const webLoginResponse = await postBackendLogin(
      `${apiBaseUrl}/api/auth/login-web`,
      requestBody,
    );

    if (!webLoginResponse) {
      return NextResponse.json(
        { message: "No se pudo conectar con el backend de autenticacion." },
        { status: 502 },
      );
    }

    if (webLoginResponse.status >= 500) {
      const mobileLoginResponse = await tryClientLoginFallback(
        apiBaseUrl,
        requestBody,
      );

      if (mobileLoginResponse?.ok) {
        return buildLoginResponse(mobileLoginResponse, true);
      }
    }

    return buildLoginResponse(webLoginResponse, false);
  } catch {
    return NextResponse.json(
      { message: "No se pudo procesar la respuesta de inicio de sesion." },
      { status: 502 },
    );
  }
}

async function postBackendLogin(url: string, body: string) {
  try {
    return await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });
  } catch {
    return null;
  }
}

async function tryClientLoginFallback(apiBaseUrl: string, requestBody: string) {
  const mobileBody = buildMobileLoginBody(requestBody);

  if (!mobileBody) {
    return null;
  }

  return postBackendLogin(`${apiBaseUrl}/api/auth/login-mobile`, mobileBody);
}

function buildMobileLoginBody(requestBody: string) {
  try {
    const parsedBody = JSON.parse(requestBody) as ParsedLoginBody;

    if (
      typeof parsedBody.email !== "string" ||
      typeof parsedBody.password !== "string"
    ) {
      return null;
    }

    return JSON.stringify({
      email: parsedBody.email,
      password: parsedBody.password,
      fcmToken: `web-login-${Date.now()}`,
    });
  } catch {
    return null;
  }
}

async function buildLoginResponse(
  backendResponse: Response,
  usedClientFallback: boolean,
) {
  const data = await readBackendResponseData(backendResponse);
  const response = NextResponse.json(data, { status: backendResponse.status });

  if (!backendResponse.ok) {
    return response;
  }

  const sessionId = extractBackendSessionIdFromHeaders(backendResponse.headers);

  if (!sessionId) {
    return NextResponse.json(
      { message: "El backend inicio sesion, pero no envio la cookie JSESSIONID." },
      { status: 502 },
    );
  }

  setFrontendSessionCookie(response, sessionId);

  if (usedClientFallback) {
    return setFrontendLoginChannelCookie(response);
  }

  return clearFrontendLoginChannelCookie(response);
}

async function readBackendResponseData(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  if (!contentType.includes("application/json")) {
    return { message: text };
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

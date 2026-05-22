import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/routes";

export function GET(request: Request) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.delete(AUTH_COOKIE_NAME);

  return response;
}

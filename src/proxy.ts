import { NextRequest, NextResponse } from "next/server";

import { FRONTEND_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookies";

const publicRoutes = [
  "/register",
  "/login",
  "/local/register",
  "/forgot-password",
  "/reset-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(FRONTEND_SESSION_COOKIE_NAME);
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "auth-required");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/restaurant/:path*", "/client/:path*"],
};

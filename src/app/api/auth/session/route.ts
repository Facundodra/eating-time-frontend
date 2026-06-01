import { NextResponse } from "next/server";

import {
  FRONTEND_SESSION_COOKIE_NAME,
  FRONTEND_SESSION_ROLE_COOKIE_NAME,
} from "@/lib/shared/auth/session-cookies";

export function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.delete(FRONTEND_SESSION_COOKIE_NAME);
  response.cookies.delete(FRONTEND_SESSION_ROLE_COOKIE_NAME);

  return response;
}

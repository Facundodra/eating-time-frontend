import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "./routes";
import type { AuthSession, AuthUser } from "./types";

export async function createSession(user: AuthUser) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify({ user }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

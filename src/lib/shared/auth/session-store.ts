import type { LoginWebResponse } from "./types";

const SESSION_STORAGE_KEY = "eating_time_session";

export type StoredSession = LoginWebResponse;

export function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;

  const session = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session) as StoredSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function clearSessionCookies() {
  await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
}

import type { LoginWebResponse } from "./types";
import {
  FRONTEND_SESSION_COOKIE_NAME,
  FRONTEND_SESSION_ROLE_COOKIE_NAME,
} from "./session-cookies";

const SESSION_STORAGE_KEY = "eating_time_session";

export type StoredSession = LoginWebResponse;

export function saveSession(session: StoredSession) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${FRONTEND_SESSION_COOKIE_NAME}=true; Path=/; SameSite=Lax`;
  document.cookie = `${FRONTEND_SESSION_ROLE_COOKIE_NAME}=${session.tipoUsuario}; Path=/; SameSite=Lax`;
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
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
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${FRONTEND_SESSION_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${FRONTEND_SESSION_ROLE_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export async function clearSessionCookies() {
  await fetch("/api/auth/session", {
    method: "DELETE",
  });
}

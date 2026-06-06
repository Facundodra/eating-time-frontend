import axios from "axios";

import { clearSessionCookies, clearStoredSession } from "@/lib/shared/auth/session-store";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

export const publicApi = axios.create({
  baseURL,
  withCredentials: true,
});

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredSession();

      try {
        await clearSessionCookies();
      } finally {
        window.location.assign("/login?reason=session-expired");
      }
    }

    return Promise.reject(error);
  },
);

// Enruta requests a través del proxy Next.js (/api/backend/...) para que el
// servidor reenvíe el JSESSIONID explícitamente, evitando problemas CORS en
// requests cross-origin del browser al backend.
export const clientApi = axios.create({
  baseURL: "/api/backend",
});

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredSession();

      try {
        await clearSessionCookies();
      } finally {
        window.location.assign("/login?reason=session-expired");
      }
    }

    return Promise.reject(error);
  },
);

import axios from "axios";

import { clearSessionCookies, clearStoredSession } from "@/lib/auth/session-store";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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

import axios from "axios";

const DEFAULT_BACKEND_API_BASE_URL =
  "https://eatingtimebackend-testing-60fe.up.railway.app";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  DEFAULT_BACKEND_API_BASE_URL;

export const publicApi = axios.create({
  baseURL,
  withCredentials: true,
});

// Enruta requests a traves del proxy Next.js (/api/backend/...) para que el
// servidor reenvie el JSESSIONID explicitamente, evitando problemas CORS en
// requests cross-origin del browser al backend.
export const clientApi = axios.create({
  baseURL: "/api/backend",
});

clientApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login?reason=session-expired");
    }

    return Promise.reject(error);
  },
);

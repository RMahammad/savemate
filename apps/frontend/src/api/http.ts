import axios from "axios";

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "@/features/auth/authStore";
import {
  normalizeUnknownError,
  type NormalizedError,
} from "@/api/normalizedError";

export const API_BASE_URL = (() => {
  const raw = import.meta.env.VITE_API_URL as string | undefined;

  // Dev default: backend runs on localhost:4000.
  // Prod default: same-origin via Nginx proxy on /api.
  const fallback = import.meta.env.PROD ? "/api" : "http://localhost:4000";

  // If VITE_API_URL is unset, use the environment-appropriate default.
  if (raw == null) return fallback;

  const trimmed = String(raw).trim();
  if (!trimmed) return fallback;

  // Common misconfig: VITE_API_URL set to the site origin (e.g. http://IP)
  // while Nginx proxies the backend under /api.
  // In that case, API calls like GET /deals hit the SPA (index.html) and the UI crashes.
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const normalized = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
    if (normalized === origin) return `${origin}/api`;
  }

  return trimmed;
})();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const res = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const token = res.data?.accessToken as string | undefined;
  return token ?? null;
}

function redirectToLoginIfPossible() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  window.location.assign("/login");
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    const originalUrl = (original?.url as string | undefined) ?? "";
    const skipAuthRefresh =
      (original as { skipAuthRefresh?: boolean } | undefined)
        ?.skipAuthRefresh ?? false;
    const isLogoutRequest = originalUrl.includes("/auth/logout");

    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !skipAuthRefresh &&
      !isLogoutRequest
    ) {
      original._retry = true;

      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });

      const newToken = await refreshing;
      if (newToken) {
        setAccessToken(newToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }

      clearAccessToken();
      redirectToLoginIfPossible();
    }

    const requestId =
      error.response?.headers?.["x-request-id"] ??
      error.response?.data?.error?.requestId ??
      "unknown";

    const normalized: NormalizedError = normalizeUnknownError(
      error.response?.data,
      requestId
    );

    return Promise.reject(normalized);
  }
);

// Back-compat with older imports
export function setAxiosAccessToken(token: string | null) {
  setAccessToken(token);
}

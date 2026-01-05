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

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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

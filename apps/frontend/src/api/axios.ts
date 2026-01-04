import axios from "axios";

import { normalizeUnknownError, type NormalizedError } from "./normalizedError";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const res = await axios.post(
    `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const token = res.data?.accessToken as string | undefined;
  return token ?? null;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original?._retry) {
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

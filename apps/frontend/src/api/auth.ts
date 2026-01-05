import type { paths } from "@savemate/api-client";

import { api } from "@/api/http";
import { getAccessToken } from "@/features/auth/authStore";
import { typedApi } from "@/api/typedClient";

type SuccessStatus = 200 | 201 | 202 | 204;

type JsonBody<T> = T extends { content: { "application/json": infer B } }
  ? B
  : never;

type RequestJsonBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = JsonBody<
  NonNullable<paths[P][M] extends { requestBody?: infer RB } ? RB : never>
>;

type SuccessJson<P extends keyof paths, M extends keyof paths[P]> = JsonBody<
  paths[P][M] extends { responses: infer R }
    ? R[Extract<keyof R, SuccessStatus>]
    : never
>;

export type LoginResponse = SuccessJson<"/auth/login", "post">;
export type RegisterResponse = SuccessJson<"/auth/register", "post">;

export function login(body: RequestJsonBody<"/auth/login", "post">) {
  return typedApi.request("post", "/auth/login", { body });
}

export function register(body: RequestJsonBody<"/auth/register", "post">) {
  return typedApi.request("post", "/auth/register", { body });
}

export function forgotPassword(body: RequestJsonBody<"/auth/forgot", "post">) {
  return typedApi.request("post", "/auth/forgot", { body });
}

export function resetPassword(body: RequestJsonBody<"/auth/reset", "post">) {
  return typedApi.request("post", "/auth/reset", { body });
}

export function logout() {
  const token = getAccessToken();
  // Use raw axios here so we can force Authorization even if the store is
  // cleared immediately after logout is clicked.
  return api.post(
    "/auth/logout",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      // Custom flag consumed by our interceptor to avoid refresh-on-401.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ skipAuthRefresh: true } as any),
    }
  );
}

export function refresh() {
  return typedApi.request("post", "/auth/refresh", {});
}

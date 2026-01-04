import type { AxiosInstance } from "axios";
import type { paths } from "./generated/openapi.js";

type HttpMethod = "get" | "post" | "patch" | "delete";

type PathKey = keyof paths;

type JsonBodyOf<T> = T extends { content: { "application/json": infer B } }
  ? B
  : never;

type RequestFor<
  P extends PathKey,
  M extends keyof paths[P],
> = paths[P][M] extends {
  requestBody: infer RB;
}
  ? JsonBodyOf<RB>
  : never;

type JsonResponseOf<T> = T extends { content: { "application/json": infer R } }
  ? R
  : never;

type ResponseFor<P extends PathKey, M extends keyof paths[P]> =
  // 200 JSON
  paths[P][M] extends {
    responses: { 200: infer R200 };
  }
    ? JsonResponseOf<R200>
    : // 201 JSON
      paths[P][M] extends {
          responses: { 201: infer R201 };
        }
      ? JsonResponseOf<R201>
      : // 204 No Content
        paths[P][M] extends {
            responses: { 204: any };
          }
        ? void
        : unknown;

export function createApiClient(axiosInstance: AxiosInstance) {
  return {
    async request<P extends PathKey, M extends HttpMethod>(
      method: M,
      path: P,
      options?: {
        params?: Record<string, any>;
        body?: RequestFor<P, M>;
      }
    ): Promise<ResponseFor<P, M>> {
      const res = await axiosInstance.request({
        method,
        url: path as string,
        params: options?.params,
        data: options?.body,
      });
      return res.data as ResponseFor<P, M>;
    },
  };
}

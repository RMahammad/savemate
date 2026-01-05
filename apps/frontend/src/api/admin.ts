import type { paths } from "@savemate/api-client";

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

export type PendingDealsParams =
  paths["/admin/deals/pending"]["get"]["parameters"] extends {
    query?: infer Q;
  }
    ? Q
    : never;

export type PendingDealsResponse = SuccessJson<"/admin/deals/pending", "get">;

export function listPendingDeals(params: PendingDealsParams) {
  return typedApi.request("get", "/admin/deals/pending", { params });
}

export type ApproveDealResponse = SuccessJson<
  "/admin/deals/{id}/approve",
  "post"
>;

export function approveDeal(id: string) {
  return typedApi.request("post", "/admin/deals/{id}/approve", {
    pathParams: { id },
  });
}

export type RejectDealBody = RequestJsonBody<
  "/admin/deals/{id}/reject",
  "post"
>;
export type RejectDealResponse = SuccessJson<
  "/admin/deals/{id}/reject",
  "post"
>;

export function rejectDeal(id: string, body: RejectDealBody) {
  return typedApi.request("post", "/admin/deals/{id}/reject", {
    pathParams: { id },
    body,
  });
}

export type AdminCategoriesResponse = SuccessJson<"/admin/categories", "get">;
export type AdminCategoryCreateBody = RequestJsonBody<
  "/admin/categories",
  "post"
>;
export type AdminCategoryCreateResponse = SuccessJson<
  "/admin/categories",
  "post"
>;
export type AdminCategoryUpdateBody = RequestJsonBody<
  "/admin/categories/{id}",
  "patch"
>;
export type AdminCategoryUpdateResponse = SuccessJson<
  "/admin/categories/{id}",
  "patch"
>;
export type AdminCategoryDeleteResponse = SuccessJson<
  "/admin/categories/{id}",
  "delete"
>;

export function listAdminCategories() {
  return typedApi.request("get", "/admin/categories", {});
}

export function createCategory(body: AdminCategoryCreateBody) {
  return typedApi.request("post", "/admin/categories", { body });
}

export function updateCategory(id: string, body: AdminCategoryUpdateBody) {
  return typedApi.request("patch", "/admin/categories/{id}", {
    pathParams: { id },
    body,
  });
}

export function deleteCategory(id: string) {
  return typedApi.request("delete", "/admin/categories/{id}", {
    pathParams: { id },
  });
}

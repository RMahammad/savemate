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

export type MyDealsResponse = SuccessJson<"/business/deals", "get">;
export type MyDealsParams =
  paths["/business/deals"]["get"]["parameters"] extends {
    query?: infer Q;
  }
    ? Q
    : never;

export type CreateMyDealBody = RequestJsonBody<"/business/deals", "post">;
export type CreateMyDealResponse = SuccessJson<"/business/deals", "post">;

export type UpdateMyDealBody = RequestJsonBody<"/business/deals/{id}", "patch">;
export type UpdateMyDealResponse = SuccessJson<"/business/deals/{id}", "patch">;

export type DeleteMyDealResponse = SuccessJson<
  "/business/deals/{id}",
  "delete"
>;

export function getMyDeals(params: MyDealsParams) {
  return typedApi.request("get", "/business/deals", { params });
}

export function createMyDeal(body: CreateMyDealBody) {
  return typedApi.request("post", "/business/deals", { body });
}

export function updateMyDeal(id: string, body: UpdateMyDealBody) {
  return typedApi.request("patch", "/business/deals/{id}", {
    pathParams: { id },
    body,
  });
}

export function deleteMyDeal(id: string) {
  return typedApi.request("delete", "/business/deals/{id}", {
    pathParams: { id },
  });
}

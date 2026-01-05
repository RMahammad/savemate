import type { paths } from "@savemate/api-client";

import { typedApi } from "@/api/typedClient";

export type DealsListResponse =
  paths["/deals"]["get"]["responses"][200]["content"]["application/json"];

export type DealsListParams = paths["/deals"]["get"]["parameters"] extends {
  query?: infer Q;
}
  ? Q
  : never;

export type DealGetResponse =
  paths["/deals/{id}"]["get"]["responses"][200]["content"]["application/json"];

export function listDeals(params: DealsListParams) {
  return typedApi.request("get", "/deals", { params });
}

export function getDeal(id: string) {
  return typedApi.request("get", "/deals/{id}", { pathParams: { id } });
}

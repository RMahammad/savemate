import type { paths } from "@savemate/api-client";

import { typedApi } from "@/api/typedClient";

export type DealsListResponse =
  paths["/deals"]["get"]["responses"][200]["content"]["application/json"];

export type DealsListParams = paths["/deals"]["get"]["parameters"] extends {
  query?: infer Q;
}
  ? Q
  : never;

export function listDeals(params: DealsListParams) {
  return typedApi.request("get", "/deals", { params });
}

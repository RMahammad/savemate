import { typedApi } from "@/api/typedClient";

export function getMyDeals(params?: unknown) {
  return typedApi.request("get", "/business/deals", { params: params as any });
}

import { typedApi } from "@/api/typedClient";

export function listPendingDeals(params?: unknown) {
  return typedApi.request("get", "/admin/deals/pending", {
    params: params as any,
  });
}

import type { paths } from "@savemate/api-client";

import { typedApi } from "@/api/typedClient";

export type CategoriesListResponse =
  paths["/categories"]["get"]["responses"][200]["content"]["application/json"];

export function listCategories() {
  return typedApi.request("get", "/categories", {});
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { paths } from "@savemate/api-client";

import type { NormalizedError } from "../../api/normalizedError";
import { typedApi } from "../../api/typedClient";

export type DealsFeedResponse =
  paths["/deals"]["get"]["responses"][200]["content"]["application/json"];

export type DealsFeedQuery = {
  page: number;
  limit: number;
  q?: string;
  city?: string;
  voivodeship?: string;
  minPrice?: number;
  maxPrice?: number;
  discountMin?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "biggestDiscount" | "lowestPrice";
};

function toApiParams(query: DealsFeedQuery) {
  return {
    page: query.page,
    limit: query.limit,
    q: query.q || undefined,
    city: query.city || undefined,
    voivodeship: query.voivodeship || undefined,
    minPrice: query.minPrice ?? undefined,
    maxPrice: query.maxPrice ?? undefined,
    discountMin: query.discountMin ?? undefined,
    tags: query.tags && query.tags.length ? query.tags : undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
    sort: query.sort || undefined,
  };
}

export function useDealsFeed(searchKey: string, query: DealsFeedQuery) {
  return useQuery<DealsFeedResponse, NormalizedError>({
    queryKey: ["deals", searchKey],
    queryFn: () =>
      typedApi.request("get", "/deals", { params: toApiParams(query) }),
    placeholderData: keepPreviousData,
  });
}

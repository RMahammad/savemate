import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { z } from "zod";

import type { paths } from "@savemate/api-client";
import { VoivodeshipSchema } from "@savemate/shared-validation";

import type { NormalizedError } from "../../api/normalizedError";
import { listDeals } from "../../api/deals";

export type DealsFeedResponse =
  paths["/deals"]["get"]["responses"][200]["content"]["application/json"];

export type DealsFeedQuery = {
  page: number;
  limit: number;
  q?: string;
  city?: string;
  categoryId?: string;
  voivodeship?: z.infer<typeof VoivodeshipSchema>;
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
    categoryId: query.categoryId || undefined,
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
    queryFn: () => listDeals(toApiParams(query)),
    placeholderData: keepPreviousData,
  });
}

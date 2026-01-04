import type { DealsQuery } from "@savemate/shared-validation";
import {
  countApprovedDeals,
  findApprovedDeals,
} from "../repositories/dealsRepo.js";

export async function listDeals(query: DealsQuery) {
  const [total, items] = await Promise.all([
    countApprovedDeals(query),
    findApprovedDeals(query),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    items,
    page: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

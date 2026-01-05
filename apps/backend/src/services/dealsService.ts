import type { DealsQuery } from "@savemate/shared-validation";
import { AppError } from "../middlewares/AppError.js";
import {
  countApprovedDeals,
  findApprovedDealById,
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

export async function getDealById(id: string) {
  const deal = await findApprovedDealById(id);
  if (!deal) {
    throw new AppError("NOT_FOUND", "Deal not found", 404);
  }
  return deal;
}

import type {
  DealCreateInput,
  DealUpdateInput,
  DealsQuery,
} from "@savemate/shared-validation";

import { AppError } from "../middlewares/AppError.js";
import {
  countBusinessDeals,
  createBusinessDeal,
  deleteDeal,
  findDealById,
  listBusinessDeals,
  updateBusinessDeal,
} from "../repositories/businessDealsRepo.js";

function toDateOrThrow(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("VALIDATION_ERROR", "Invalid request", 400, {
      fieldErrors: { [field]: ["Invalid datetime"] },
    });
  }
  return date;
}

export async function listMyDeals(businessId: string, query: DealsQuery) {
  const [total, items] = await Promise.all([
    countBusinessDeals(businessId, query),
    listBusinessDeals(businessId, query),
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

export async function createMyDeal(businessId: string, input: DealCreateInput) {
  const validFrom = toDateOrThrow(input.validFrom, "validFrom");
  const validTo = toDateOrThrow(input.validTo, "validTo");

  const created = await createBusinessDeal(businessId, {
    title: input.title,
    description: input.description,
    price: input.price,
    originalPrice: input.originalPrice,
    categoryId: input.categoryId,
    city: input.city,
    voivodeship: input.voivodeship,
    tags: input.tags,
    validFrom,
    validTo,
  });

  return created;
}

export async function updateMyDeal(
  businessId: string,
  dealId: string,
  input: DealUpdateInput
) {
  if ("status" in input && input.status !== undefined) {
    throw new AppError(
      "FORBIDDEN",
      "Deal status cannot be changed by business",
      403
    );
  }

  const existing = await findDealById(dealId);
  if (!existing) throw new AppError("NOT_FOUND", "Deal not found", 404);
  if (existing.businessId !== businessId)
    throw new AppError("FORBIDDEN", "Cannot modify another business deal", 403);

  const next: any = { ...input };
  if (typeof input.validFrom === "string")
    next.validFrom = toDateOrThrow(input.validFrom, "validFrom");
  if (typeof input.validTo === "string")
    next.validTo = toDateOrThrow(input.validTo, "validTo");

  return updateBusinessDeal(dealId, next);
}

export async function deleteMyDeal(businessId: string, dealId: string) {
  const existing = await findDealById(dealId);
  if (!existing) throw new AppError("NOT_FOUND", "Deal not found", 404);
  if (existing.businessId !== businessId)
    throw new AppError("FORBIDDEN", "Cannot delete another business deal", 403);

  await deleteDeal(dealId);
  return { id: dealId };
}

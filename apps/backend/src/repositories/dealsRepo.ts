import { prisma } from "../db.js";

import type { DealsQuery } from "@savemate/shared-validation";
import type { Prisma } from "@prisma/client";

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function normalizeTags(tags: DealsQuery["tags"]): string[] | undefined {
  if (!tags) return undefined;
  if (typeof tags === "string") return [tags];
  if (Array.isArray(tags)) return tags;
  return undefined;
}

export function buildApprovedDealsWhere(
  query: DealsQuery
): Prisma.DealWhereInput {
  const tags = normalizeTags(query.tags);
  const dateFrom = toDate(query.dateFrom);
  const dateTo = toDate(query.dateTo);

  const where: Prisma.DealWhereInput = {
    status: "APPROVED",
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.city ? { city: query.city } : {}),
    ...(query.voivodeship ? { voivodeship: query.voivodeship } : {}),
    ...(typeof query.minPrice === "number"
      ? { price: { gte: query.minPrice } }
      : {}),
    ...(typeof query.maxPrice === "number"
      ? {
          price: {
            ...(typeof query.minPrice === "number"
              ? { gte: query.minPrice }
              : {}),
            lte: query.maxPrice,
          },
        }
      : {}),
    ...(typeof query.discountMin === "number"
      ? { discountPercent: { gte: query.discountMin } }
      : {}),
    ...(tags?.length ? { tags: { hasSome: tags } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }
      : {}),
    // Date range filtering by overlap:
    // - if dateFrom is provided, include deals whose validTo >= dateFrom
    // - if dateTo is provided, include deals whose validFrom <= dateTo
    ...(dateFrom || dateTo
      ? {
          AND: [
            ...(dateFrom ? [{ validTo: { gte: dateFrom } }] : []),
            ...(dateTo ? [{ validFrom: { lte: dateTo } }] : []),
          ],
        }
      : {}),
  };

  return where;
}

export function buildDealsOrderBy(
  sort: DealsQuery["sort"]
): Prisma.DealOrderByWithRelationInput[] {
  switch (sort) {
    case "biggestDiscount":
      return [
        { discountPercent: "desc" },
        { createdAt: "desc" },
        { id: "desc" },
      ];
    case "lowestPrice":
      return [{ price: "asc" }, { createdAt: "desc" }, { id: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export async function countApprovedDeals(query: DealsQuery) {
  const where = buildApprovedDealsWhere(query);
  return prisma.deal.count({ where });
}

export async function findApprovedDeals(query: DealsQuery) {
  const where = buildApprovedDealsWhere(query);
  const orderBy = buildDealsOrderBy(query.sort);
  const skip = (query.page - 1) * query.limit;

  return prisma.deal.findMany({
    where,
    orderBy,
    skip,
    take: query.limit,
    select: {
      id: true,
      title: true,
      description: true,
      usageTerms: true,
      imageUrl: true,
      price: true,
      originalPrice: true,
      discountPercent: true,
      status: true,
      city: true,
      voivodeship: true,
      categoryId: true,
      tags: true,
      validFrom: true,
      validTo: true,
      createdAt: true,
    },
  });
}

export async function findApprovedDealById(id: string) {
  return prisma.deal.findFirst({
    where: { id, status: "APPROVED" },
    select: {
      id: true,
      title: true,
      description: true,
      usageTerms: true,
      imageUrl: true,
      price: true,
      originalPrice: true,
      discountPercent: true,
      status: true,
      city: true,
      voivodeship: true,
      categoryId: true,
      tags: true,
      validFrom: true,
      validTo: true,
      createdAt: true,
    },
  });
}

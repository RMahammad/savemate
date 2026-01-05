import type { DealsQuery } from "@savemate/shared-validation";
import type { Prisma } from "@prisma/client";

import { prisma } from "../db.js";

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

export function buildBusinessDealsWhere(
  businessId: string,
  query: DealsQuery
): Prisma.DealWhereInput {
  const tags = normalizeTags(query.tags);
  const dateFrom = toDate(query.dateFrom);
  const dateTo = toDate(query.dateTo);

  const where: Prisma.DealWhereInput = {
    businessId,
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

export function buildBusinessDealsOrderBy(
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

export async function findDealById(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    select: {
      id: true,
      businessId: true,
      categoryId: true,
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
      tags: true,
      validFrom: true,
      validTo: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function countBusinessDeals(
  businessId: string,
  query: DealsQuery
) {
  const where = buildBusinessDealsWhere(businessId, query);
  return prisma.deal.count({ where });
}

export async function listBusinessDeals(businessId: string, query: DealsQuery) {
  const where = buildBusinessDealsWhere(businessId, query);
  const orderBy = buildBusinessDealsOrderBy(query.sort);
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

export async function createBusinessDeal(
  businessId: string,
  data: {
    title: string;
    description: string;
    usageTerms?: string;
    imageUrl?: string;
    price: number;
    originalPrice: number;
    categoryId: string;
    city: string;
    voivodeship: string;
    tags: string[];
    validFrom: Date;
    validTo: Date;
  }
) {
  const discountPercent = Math.round(
    ((data.originalPrice - data.price) / data.originalPrice) * 100
  );

  return prisma.deal.create({
    data: {
      businessId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      ...(data.usageTerms !== undefined ? { usageTerms: data.usageTerms } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      price: data.price,
      originalPrice: data.originalPrice,
      discountPercent,
      status: "PENDING",
      city: data.city,
      voivodeship: data.voivodeship,
      tags: data.tags,
      validFrom: data.validFrom,
      validTo: data.validTo,
    },
    select: { id: true, status: true },
  });
}

export async function updateBusinessDeal(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    usageTerms: string | null;
    imageUrl: string | null;
    price: number;
    originalPrice: number;
    categoryId: string;
    city: string;
    voivodeship: string;
    tags: string[];
    validFrom: Date;
    validTo: Date;
  }>
) {
  const next: Prisma.DealUpdateInput = {
    ...("title" in data ? { title: data.title } : {}),
    ...("description" in data ? { description: data.description } : {}),
    ...("usageTerms" in data ? { usageTerms: data.usageTerms } : {}),
    ...("imageUrl" in data ? { imageUrl: data.imageUrl } : {}),
    ...("categoryId" in data ? { categoryId: data.categoryId } : {}),
    ...("city" in data ? { city: data.city } : {}),
    ...("voivodeship" in data ? { voivodeship: data.voivodeship } : {}),
    ...("tags" in data ? { tags: data.tags } : {}),
    ...("validFrom" in data ? { validFrom: data.validFrom } : {}),
    ...("validTo" in data ? { validTo: data.validTo } : {}),
  };

  // If price/originalPrice change, recompute discount.
  const hasPrice = typeof data.price === "number";
  const hasOriginal = typeof data.originalPrice === "number";
  if (hasPrice || hasOriginal) {
    const current = await prisma.deal.findUnique({
      where: { id },
      select: { price: true, originalPrice: true },
    });

    if (current) {
      const price = hasPrice ? data.price! : current.price;
      const originalPrice = hasOriginal
        ? data.originalPrice!
        : current.originalPrice;
      next.price = price;
      next.originalPrice = originalPrice;
      next.discountPercent = Math.round(
        ((originalPrice - price) / originalPrice) * 100
      );
    }
  }

  return prisma.deal.update({
    where: { id },
    data: next,
    select: { id: true, status: true },
  });
}

export async function deleteDeal(id: string) {
  return prisma.deal.delete({ where: { id }, select: { id: true } });
}

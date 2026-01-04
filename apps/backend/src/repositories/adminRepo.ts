import { prisma } from "../db.js";

export async function listPendingDeals(input: { skip: number; take: number }) {
  const items = await prisma.deal.findMany({
    where: { status: "PENDING" },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: input.skip,
    take: input.take,
    select: {
      id: true,
      title: true,
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
      businessId: true,
    },
  });

  return items;
}

export async function countPendingDeals() {
  return prisma.deal.count({ where: { status: "PENDING" } });
}

export async function findDealById(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    select: { id: true, status: true, businessId: true },
  });
}

export async function approveDeal(id: string) {
  return prisma.deal.update({
    where: { id },
    data: { status: "APPROVED" },
    select: { id: true, status: true },
  });
}

export async function rejectDeal(id: string) {
  return prisma.deal.update({
    where: { id },
    data: { status: "REJECTED" },
    select: { id: true, status: true },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createCategory(input: { name: string; slug: string }) {
  return prisma.category.create({
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string }
) {
  return prisma.category.update({
    where: { id },
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  return { ok: true };
}

export async function createAuditLog(input: {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      meta: input.meta as any,
    },
    select: { id: true },
  });
}

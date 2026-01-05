import {
  type AdminDealsQuery,
  type AdminRejectInput,
  type AdminAllDealsQuery,
  type AdminSetDealStatusInput,
} from "@savemate/shared-validation";

import { AppError } from "../middlewares/AppError.js";
import {
  approveDeal,
  countDeals,
  countPendingDeals,
  createAuditLog,
  createCategory,
  deleteCategory,
  findDealById,
  listDeals,
  listCategories,
  listPendingDeals,
  rejectDeal,
  setDealStatus,
  updateCategory,
} from "../repositories/adminRepo.js";

export async function listDealsForAdmin(query: AdminAllDealsQuery) {
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    listDeals({ skip, take: query.limit, status: query.status }),
    countDeals({ status: query.status }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    items: items.map((d) => ({
      ...d,
      validFrom: d.validFrom.toISOString(),
      validTo: d.validTo.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
    page: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function listPendingDealsForAdmin(query: AdminDealsQuery) {
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    listPendingDeals({ skip, take: query.limit }),
    countPendingDeals(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / query.limit));

  return {
    items: items.map((d) => ({
      ...d,
      validFrom: d.validFrom.toISOString(),
      validTo: d.validTo.toISOString(),
      createdAt: d.createdAt.toISOString(),
    })),
    page: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

export async function approveDealForAdmin(actorId: string, dealId: string) {
  const deal = await findDealById(dealId);
  if (!deal) throw new AppError("NOT_FOUND", "Deal not found", 404);

  if (deal.status !== "PENDING") {
    throw new AppError("CONFLICT", "Only PENDING deals can be approved", 409, {
      status: deal.status,
    });
  }

  const updated = await approveDeal(dealId);

  await createAuditLog({
    actorId,
    action: "DEAL_APPROVE",
    entity: "Deal",
    entityId: dealId,
    meta: { from: "PENDING", to: updated.status },
  });

  return updated;
}

export async function rejectDealForAdmin(
  actorId: string,
  dealId: string,
  input: AdminRejectInput
) {
  const deal = await findDealById(dealId);
  if (!deal) throw new AppError("NOT_FOUND", "Deal not found", 404);

  if (deal.status !== "PENDING") {
    throw new AppError("CONFLICT", "Only PENDING deals can be rejected", 409, {
      status: deal.status,
    });
  }

  const updated = await rejectDeal(dealId);

  await createAuditLog({
    actorId,
    action: "DEAL_REJECT",
    entity: "Deal",
    entityId: dealId,
    meta: { from: "PENDING", to: updated.status, reason: input.reason },
  });

  return updated;
}

export async function setDealStatusForAdmin(
  actorId: string,
  dealId: string,
  input: AdminSetDealStatusInput
) {
  const deal = await findDealById(dealId);
  if (!deal) throw new AppError("NOT_FOUND", "Deal not found", 404);

  const updated = await setDealStatus(dealId, input.status);

  await createAuditLog({
    actorId,
    action: "DEAL_SET_STATUS",
    entity: "Deal",
    entityId: dealId,
    meta: { from: deal.status, to: updated.status, reason: input.reason },
  });

  return updated;
}

export async function listCategoriesForAdmin() {
  const cats = await listCategories();
  return cats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function createCategoryForAdmin(
  actorId: string,
  input: {
    name: string;
    slug: string;
  }
) {
  const created = await createCategory(input);

  await createAuditLog({
    actorId,
    action: "CATEGORY_CREATE",
    entity: "Category",
    entityId: created.id,
    meta: { name: created.name, slug: created.slug },
  });

  return {
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateCategoryForAdmin(
  actorId: string,
  id: string,
  input: { name?: string; slug?: string }
) {
  const updated = await updateCategory(id, input);

  await createAuditLog({
    actorId,
    action: "CATEGORY_UPDATE",
    entity: "Category",
    entityId: updated.id,
    meta: input,
  });

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteCategoryForAdmin(actorId: string, id: string) {
  const deleted = await deleteCategory(id);

  await createAuditLog({
    actorId,
    action: "CATEGORY_DELETE",
    entity: "Category",
    entityId: id,
  });

  return deleted;
}

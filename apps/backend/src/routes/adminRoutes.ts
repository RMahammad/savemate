import { Router } from "express";
import {
  AdminAllDealsQuerySchema,
  AdminDealsQuerySchema,
  AdminRejectSchema,
  AdminSetDealStatusSchema,
  CategoryCreateSchema,
  CategoryIdParamsSchema,
  CategoryUpdateSchema,
  DealIdParamsSchema,
} from "@savemate/shared-validation";

import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.js";
import {
  approveDealForAdmin,
  createCategoryForAdmin,
  deleteCategoryForAdmin,
  listDealsForAdmin,
  listCategoriesForAdmin,
  listPendingDealsForAdmin,
  rejectDealForAdmin,
  setDealStatusForAdmin,
  updateCategoryForAdmin,
} from "../services/adminService.js";

export const adminRouter = Router();

adminRouter.get(
  "/deals",
  requireAuth,
  requireRole("ADMIN"),
  validateQuery(AdminAllDealsQuerySchema),
  async (req, res) => {
    const q = req.query as any;
    const result = await listDealsForAdmin(q);
    return res.json(result);
  }
);

adminRouter.patch(
  "/deals/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(DealIdParamsSchema),
  validateBody(AdminSetDealStatusSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const { id } = req.params as any;
    const result = await setDealStatusForAdmin(
      user.userId,
      id,
      req.body as any
    );
    return res.json(result);
  }
);

adminRouter.get(
  "/deals/pending",
  requireAuth,
  requireRole("ADMIN"),
  validateQuery(AdminDealsQuerySchema),
  async (req, res) => {
    const q = req.query as any;
    const result = await listPendingDealsForAdmin(q);
    return res.json(result);
  }
);

adminRouter.post(
  "/deals/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(DealIdParamsSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const { id } = req.params as any;
    const result = await approveDealForAdmin(user.userId, id);
    return res.json(result);
  }
);

adminRouter.post(
  "/deals/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(DealIdParamsSchema),
  validateBody(AdminRejectSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const { id } = req.params as any;
    const result = await rejectDealForAdmin(user.userId, id, req.body as any);
    return res.json(result);
  }
);

adminRouter.get(
  "/categories",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    const result = await listCategoriesForAdmin();
    return res.json({ items: result });
  }
);

adminRouter.post(
  "/categories",
  requireAuth,
  requireRole("ADMIN"),
  validateBody(CategoryCreateSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const created = await createCategoryForAdmin(user.userId, req.body as any);
    return res.status(201).json(created);
  }
);

adminRouter.patch(
  "/categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(CategoryIdParamsSchema),
  validateBody(CategoryUpdateSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const { id } = req.params as any;
    const updated = await updateCategoryForAdmin(
      user.userId,
      id,
      req.body as any
    );
    return res.json(updated);
  }
);

adminRouter.delete(
  "/categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateParams(CategoryIdParamsSchema),
  async (req, res) => {
    const user = (req as any).user as { userId: string };
    const { id } = req.params as any;
    const deleted = await deleteCategoryForAdmin(user.userId, id);
    return res.json(deleted);
  }
);

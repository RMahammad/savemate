import { Router } from "express";
import {
  DealCreateSchema,
  DealIdParamsSchema,
  DealUpdateSchema,
  DealsQuerySchema,
} from "@savemate/shared-validation";

import { requireAuth, requireRole } from "../middlewares/auth.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.js";
import {
  createMyDeal,
  deleteMyDeal,
  listMyDeals,
  updateMyDeal,
} from "../services/businessDealsService.js";

export const businessDealsRouter = Router();

businessDealsRouter.get(
  "/",
  requireAuth,
  requireRole("BUSINESS"),
  validateQuery(DealsQuerySchema),
  async (req, res) => {
    const user = (req as any).user as { businessId: string };
    const q = req.query as any;
    const result = await listMyDeals(user.businessId, q);
    return res.json(result);
  }
);

businessDealsRouter.post(
  "/",
  requireAuth,
  requireRole("BUSINESS"),
  validateBody(DealCreateSchema),
  async (req, res) => {
    const user = (req as any).user as { businessId: string };
    const created = await createMyDeal(user.businessId, req.body as any);
    return res.status(201).json(created);
  }
);

businessDealsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("BUSINESS"),
  validateParams(DealIdParamsSchema),
  validateBody(DealUpdateSchema),
  async (req, res) => {
    const user = (req as any).user as { businessId: string };
    const { id } = req.params as any;
    const updated = await updateMyDeal(user.businessId, id, req.body as any);
    return res.json(updated);
  }
);

businessDealsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("BUSINESS"),
  validateParams(DealIdParamsSchema),
  async (req, res) => {
    const user = (req as any).user as { businessId: string };
    const { id } = req.params as any;
    const deleted = await deleteMyDeal(user.businessId, id);
    return res.json(deleted);
  }
);

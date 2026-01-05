import { Router } from "express";
import {
  DealIdParamsSchema,
  DealsQuerySchema,
} from "@savemate/shared-validation";
import { validateParams, validateQuery } from "../middlewares/validate.js";
import { getDealById, listDeals } from "../services/dealsService.js";

export const dealsRouter = Router();

dealsRouter.get("/", validateQuery(DealsQuerySchema), async (req, res) => {
  const q = req.query as any;
  const result = await listDeals(q);
  return res.json(result);
});

dealsRouter.get(
  "/:id",
  validateParams(DealIdParamsSchema),
  async (req, res) => {
    const { id } = req.params as any;
    const deal = await getDealById(id);
    return res.json(deal);
  }
);

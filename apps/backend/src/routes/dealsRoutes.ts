import { Router } from "express";
import { DealsQuerySchema } from "@savemate/shared-validation";
import { validateQuery } from "../middlewares/validate.js";
import { listDeals } from "../services/dealsService.js";

export const dealsRouter = Router();

dealsRouter.get("/", validateQuery(DealsQuerySchema), async (req, res) => {
  const q = req.query as any;
  const result = await listDeals(q);
  return res.json(result);
});

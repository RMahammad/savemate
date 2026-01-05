import { Router } from "express";

import { listCategoriesPublic } from "../services/categoriesService.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res) => {
  const items = await listCategoriesPublic();
  return res.json({ items });
});

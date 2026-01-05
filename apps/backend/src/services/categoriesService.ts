import { listCategories } from "../repositories/adminRepo.js";

export async function listCategoriesPublic() {
  const cats = await listCategories();
  return cats.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

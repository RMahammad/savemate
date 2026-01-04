import { z } from "zod";

export const CategoryIdSchema = z.string().min(1);

export const CategorySchema = z.object({
  id: CategoryIdSchema,
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
});

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;

export const CategoryIdParamsSchema = z.object({ id: CategoryIdSchema });

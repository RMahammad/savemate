import { z } from "zod";

export const AdminDealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest"]).default("newest"),
});

export type AdminDealsQuery = z.infer<typeof AdminDealsQuerySchema>;

export const AdminRejectSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type AdminRejectInput = z.infer<typeof AdminRejectSchema>;

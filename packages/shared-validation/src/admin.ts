import { z } from "zod";

import { DealStatusSchema } from "./deal.js";

export const AdminDealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["newest"]).default("newest"),
});

export type AdminDealsQuery = z.infer<typeof AdminDealsQuerySchema>;

// Admin list-all deals query (optionally filter by status)
export const AdminAllDealsQuerySchema = AdminDealsQuerySchema.extend({
  status: DealStatusSchema.optional(),
});

export type AdminAllDealsQuery = z.infer<typeof AdminAllDealsQuerySchema>;

export const AdminRejectSchema = z.object({
  reason: z.string().min(3).max(500),
});

export type AdminRejectInput = z.infer<typeof AdminRejectSchema>;

export const AdminSetDealStatusSchema = z
  .object({
    status: DealStatusSchema,
    // Only required when setting status to REJECTED.
    reason: z.string().min(3).max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "REJECTED" && !v.reason) {
      ctx.addIssue({
        code: "custom",
        message: "reason is required when status is REJECTED",
        path: ["reason"],
      });
    }
  });

export type AdminSetDealStatusInput = z.infer<typeof AdminSetDealStatusSchema>;

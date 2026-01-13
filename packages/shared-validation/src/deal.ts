import { z } from "zod";

export const VoivodeshipSchema = z.enum([
  "DOLNOSLASKIE",
  "KUJAWSKO_POMORSKIE",
  "LUBELSKIE",
  "LUBUSKIE",
  "LODZKIE",
  "MALOPOLSKIE",
  "MAZOWIECKIE",
  "OPOLSKIE",
  "PODKARPACKIE",
  "PODLASKIE",
  "POMORSKIE",
  "SLASKIE",
  "SWIETOKRZYSKIE",
  "WARMINSKO_MAZURSKIE",
  "WIELKOPOLSKIE",
  "ZACHODNIOPOMORSKIE",
]);

export const DealStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const DealImageMimeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DealCreateBaseSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  usageTerms: z.string().min(1).max(5000).optional(),
  // Upload support: send base64 (optionally as data URL) and backend will persist and set imageUrl.
  imageBase64: z.string().min(1).max(15_000_000).optional(),
  imageMime: DealImageMimeSchema.optional(),
  // Also allow setting imageUrl directly (e.g. admin/backfill).
  imageUrl: z.string().url().max(2000).optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive(),
  categoryId: z.string().min(1),
  city: z.string().min(2).max(80),
  voivodeship: VoivodeshipSchema,
  tags: z.array(z.string().min(1).max(30)).max(20).default([]),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
});

export const DealCreateSchema = DealCreateBaseSchema.refine(
  (v) => v.originalPrice >= v.price,
  {
    message: "originalPrice must be >= price",
    path: ["originalPrice"],
  }
);

export const DealUpdateSchema = DealCreateBaseSchema.partial()
  .extend({
    status: DealStatusSchema.optional(),
  })
  .refine(
    (v) => {
      if (typeof v.originalPrice !== "number" || typeof v.price !== "number") {
        return true;
      }
      return v.originalPrice >= v.price;
    },
    {
      message: "originalPrice must be >= price",
      path: ["originalPrice"],
    }
  );

export const DealsSortSchema = z
  .enum(["newest", "biggestDiscount", "lowestPrice"])
  .default("newest");

export const DealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),

  categoryId: z.string().optional(),
  city: z.string().optional(),
  voivodeship: VoivodeshipSchema.optional(),

  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  discountMin: z.coerce.number().min(0).max(100).optional(),

  q: z.string().max(200).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),

  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),

  sort: DealsSortSchema,
});

export type DealsQuery = z.infer<typeof DealsQuerySchema>;

export type DealCreateInput = z.infer<typeof DealCreateSchema>;
export type DealUpdateInput = z.infer<typeof DealUpdateSchema>;

export const DealIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid deal id");

export const DealIdParamsSchema = z.object({ id: DealIdSchema });

export type DealIdParams = z.infer<typeof DealIdParamsSchema>;

// Minimal list/preview shape used by GET /deals
export const DealSchema = z.object({
  id: DealIdSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  usageTerms: z.string().min(1).max(5000).nullable().optional(),
  imageUrl: z.string().url().max(2000).nullable().optional(),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative(),
  discountPercent: z.number().int().min(0).max(100),
  status: DealStatusSchema,
  city: z.string().min(1),
  voivodeship: VoivodeshipSchema,
  categoryId: z.string().min(1),
  tags: z.array(z.string()),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Deal = z.infer<typeof DealSchema>;

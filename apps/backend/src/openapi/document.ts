import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  AdminDealsQuerySchema,
  AdminRejectSchema,
  CategoryCreateSchema,
  CategoryIdParamsSchema,
  CategorySchema,
  CategoryUpdateSchema,
  DealCreateSchema,
  DealIdParamsSchema,
  DealSchema,
  DealUpdateSchema,
  DealsQuerySchema,
  ErrorEnvelopeSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  registry as sharedRegistry,
} from "@savemate/shared-validation";

extendZodWithOpenApi(z);

const bearerAuth = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
} as const;

const ErrorResponse = {
  description: "Error",
  content: {
    "application/json": {
      schema: ErrorEnvelopeSchema,
    },
  },
} as const;

const PageSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

const DealsListResponseSchema = z.object({
  items: z.array(DealSchema),
  page: PageSchema,
});

const BusinessDealCreateResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "DRAFT", "APPROVED", "REJECTED", "EXPIRED"]),
});

const BusinessDealUpdateResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "DRAFT", "APPROVED", "REJECTED", "EXPIRED"]),
});

const DeleteOkSchema = z.object({ ok: z.boolean() });

const HealthSchema = z.object({ ok: z.boolean() });

const AuthAccessTokenSchema = z.object({ accessToken: z.string().min(1) });

const ForgotPasswordResponseSchema = z.object({
  ok: z.boolean(),
  token: z.string().nullable().optional(),
});

const ResetPasswordResponseSchema = z.object({ ok: z.boolean() });

const AdminPendingDealSchema = DealSchema.extend({
  businessId: z.string().min(1),
});

const AdminPendingDealsListResponseSchema = z.object({
  items: z.array(AdminPendingDealSchema),
  page: PageSchema,
});

const AdminModerationResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "DRAFT", "APPROVED", "REJECTED", "EXPIRED"]),
});

const CategoriesListResponseSchema = z.object({
  items: z.array(CategorySchema),
});

function buildRegistry(): OpenAPIRegistry {
  // We reuse the shared registry (canonical schemas) and add backend paths.
  // Using a new registry and trying to merge is more work than it's worth.
  const registry = sharedRegistry as unknown as OpenAPIRegistry;

  registry.register("Page", PageSchema);
  registry.register("DealsListResponse", DealsListResponseSchema);
  registry.register("AdminPendingDeal", AdminPendingDealSchema);
  registry.register(
    "AdminPendingDealsListResponse",
    AdminPendingDealsListResponseSchema
  );
  registry.register("CategoriesListResponse", CategoriesListResponseSchema);
  registry.register("AuthAccessToken", AuthAccessTokenSchema);

  // Health
  registry.registerPath({
    method: "get",
    path: "/health",
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: HealthSchema } },
      },
    },
  });

  // Auth
  registry.registerPath({
    method: "post",
    path: "/auth/register",
    request: {
      body: {
        content: {
          "application/json": {
            schema: RegisterSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Created",
        content: { "application/json": { schema: AuthAccessTokenSchema } },
      },
      400: ErrorResponse,
      409: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/login",
    request: {
      body: {
        content: {
          "application/json": {
            schema: LoginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: AuthAccessTokenSchema } },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: AuthAccessTokenSchema } },
      },
      401: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/logout",
    security: [{ bearerAuth: [] }],
    responses: {
      204: { description: "No Content" },
      401: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/forgot",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ForgotPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: ForgotPasswordResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/reset",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ResetPasswordSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: ResetPasswordResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      500: ErrorResponse,
    },
  });

  // Deals (public)
  registry.registerPath({
    method: "get",
    path: "/deals",
    request: {
      query: DealsQuerySchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: DealsListResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      500: ErrorResponse,
    },
  });

  // Business deals
  registry.registerPath({
    method: "get",
    path: "/business/deals",
    security: [{ bearerAuth: [] }],
    request: {
      query: DealsQuerySchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: DealsListResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/business/deals",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: DealCreateSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Created",
        content: {
          "application/json": {
            schema: BusinessDealCreateResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/business/deals/{id}",
    security: [{ bearerAuth: [] }],
    request: {
      params: DealIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: DealUpdateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: BusinessDealUpdateResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/business/deals/{id}",
    security: [{ bearerAuth: [] }],
    request: {
      params: DealIdParamsSchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: z.object({ id: z.string().min(1) }),
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
  });

  // Admin moderation
  registry.registerPath({
    method: "get",
    path: "/admin/deals/pending",
    security: [{ bearerAuth: [] }],
    request: {
      query: AdminDealsQuerySchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: AdminPendingDealsListResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/deals/{id}/approve",
    security: [{ bearerAuth: [] }],
    request: {
      params: DealIdParamsSchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: AdminModerationResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/deals/{id}/reject",
    security: [{ bearerAuth: [] }],
    request: {
      params: DealIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: AdminRejectSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: AdminModerationResponseSchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      500: ErrorResponse,
    },
  });

  // Admin categories
  registry.registerPath({
    method: "get",
    path: "/admin/categories",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: CategoriesListResponseSchema,
          },
        },
      },
      401: ErrorResponse,
      403: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/categories",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CategoryCreateSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Created",
        content: {
          "application/json": {
            schema: CategorySchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      409: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/admin/categories/{id}",
    security: [{ bearerAuth: [] }],
    request: {
      params: CategoryIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: CategoryUpdateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: CategorySchema,
          },
        },
      },
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      409: ErrorResponse,
      500: ErrorResponse,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/admin/categories/{id}",
    security: [{ bearerAuth: [] }],
    request: {
      params: CategoryIdParamsSchema,
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: DeleteOkSchema,
          },
        },
      },
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
      500: ErrorResponse,
    },
  });

  return registry;
}

export function createOpenApiDocument() {
  const registry = buildRegistry();

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "SaveMate API",
      version: "0.1.0",
    },
    servers: [{ url: "http://localhost:4000" }],
  });

  const { components } = generator.generateComponents();

  return {
    ...document,
    components: {
      ...components,
      securitySchemes: {
        ...(components?.securitySchemes ?? {}),
        bearerAuth,
      },
    },
  };
}

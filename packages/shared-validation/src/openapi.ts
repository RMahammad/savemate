import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  AdminAllDealsQuerySchema,
  AdminDealsQuerySchema,
  AdminRejectSchema,
  AdminSetDealStatusSchema,
} from "./admin.js";
import {
  CategoryCreateSchema,
  CategorySchema,
  CategoryUpdateSchema,
} from "./category.js";
import { LoginSchema, RegisterSchema } from "./auth.js";
import {
  DealCreateSchema,
  DealIdParamsSchema,
  DealSchema,
  DealUpdateSchema,
  DealsQuerySchema,
} from "./deal.js";
import { ErrorEnvelopeSchema } from "./error.js";

export const registry = new OpenAPIRegistry();

extendZodWithOpenApi(z);

registry.register("ErrorEnvelope", ErrorEnvelopeSchema);

registry.register("LoginInput", LoginSchema);
registry.register("RegisterInput", RegisterSchema);

registry.register("AdminDealsQuery", AdminDealsQuerySchema);
registry.register("AdminAllDealsQuery", AdminAllDealsQuerySchema);
registry.register("AdminRejectInput", AdminRejectSchema);
registry.register("AdminSetDealStatusInput", AdminSetDealStatusSchema);

registry.register("Category", CategorySchema);
registry.register("CategoryCreateInput", CategoryCreateSchema);
registry.register("CategoryUpdateInput", CategoryUpdateSchema);

registry.register("DealCreateInput", DealCreateSchema);
registry.register("DealUpdateInput", DealUpdateSchema);
registry.register("DealsQuery", DealsQuerySchema);
registry.register("Deal", DealSchema);
registry.register("DealIdParams", DealIdParamsSchema);

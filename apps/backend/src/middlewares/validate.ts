import type { z, ZodTypeAny } from "zod";
import { AppError } from "./AppError.js";

type ReqPart = "body" | "query" | "params";

function validatePart<TSchema extends ZodTypeAny>(
  part: ReqPart,
  schema: TSchema
) {
  return (req: any, _res: any, next: any) => {
    const parsed = schema.safeParse(req[part]);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return next(
        new AppError("VALIDATION_ERROR", "Invalid request", 400, {
          fieldErrors,
        })
      );
    }

    req[part] = parsed.data;
    return next();
  };
}

export const validateBody = <TSchema extends ZodTypeAny>(schema: TSchema) =>
  validatePart("body", schema);

export const validateQuery = <TSchema extends ZodTypeAny>(schema: TSchema) =>
  validatePart("query", schema);

export const validateParams = <TSchema extends ZodTypeAny>(schema: TSchema) =>
  validatePart("params", schema);

export type Validated<T extends ZodTypeAny> = z.infer<T>;

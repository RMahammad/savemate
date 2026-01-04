import type { z } from "zod";
import { ErrorCodeSchema } from "@savemate/shared-validation";

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

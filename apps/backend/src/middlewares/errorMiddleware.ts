import type { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";

function isJwtAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as any).name as unknown;
  return (
    name === "JsonWebTokenError" ||
    name === "TokenExpiredError" ||
    name === "NotBeforeError"
  );
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId ?? "unknown";

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Normalize JWT verification errors (e.g. refresh token) into our envelope.
  if (isJwtAuthError(err)) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
        details: undefined,
        requestId,
      },
    });
  }

  req.log?.error({ err, requestId }, "Unhandled error");

  return res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Something went wrong",
      details: undefined,
      requestId,
    },
  });
}

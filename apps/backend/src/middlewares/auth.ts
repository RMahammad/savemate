import type { NextFunction, Request, Response } from "express";
import type { Role } from "@savemate/shared-validation";
import { AppError } from "./AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../db.js";

export type AuthUser = {
  userId: string;
  role: Role;
  businessId?: string;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length)
    : undefined;

  if (!token)
    return next(new AppError("UNAUTHORIZED", "Missing access token", 401));

  try {
    const payload = verifyAccessToken(token);
    (req as any).user = {
      userId: payload.sub,
      role: payload.role,
      businessId: payload.businessId,
    } satisfies AuthUser;
    return next();
  } catch {
    return next(new AppError("UNAUTHORIZED", "Invalid access token", 401));
  }
}

export function requireRole(...roles: Role[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user)
      return next(new AppError("UNAUTHORIZED", "Not authenticated", 401));
    if (!roles.includes(user.role))
      return next(new AppError("FORBIDDEN", "Insufficient role", 403));

    if (
      user.role === "BUSINESS" &&
      roles.includes("BUSINESS") &&
      !user.businessId
    ) {
      const profile = await prisma.businessProfile.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      if (!profile)
        return next(new AppError("FORBIDDEN", "Business profile missing", 403));

      user.businessId = profile.id;
      (req as any).user = user;
    }

    return next();
  };
}

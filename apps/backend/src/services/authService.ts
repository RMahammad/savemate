import argon2 from "argon2";
import { randomBytes } from "node:crypto";
import type {
  JwtAccessPayload,
  LoginInput,
  RegisterInput,
} from "@savemate/shared-validation";
import { AppError } from "../middlewares/AppError.js";
import { prisma } from "../db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

type PasswordResetRecord = {
  userId: string;
  expiresAt: number;
};

const passwordResetTokens = new Map<string, PasswordResetRecord>();

function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw new AppError("CONFLICT", "Email already registered", 409);

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: { id: true, role: true },
  });

  const createdBusinessProfile =
    user.role === "BUSINESS"
      ? await prisma.businessProfile.create({
          data: {
            userId: user.id,
            name: input.email,
          },
          select: { id: true },
        })
      : null;

  const payloadBase: JwtAccessPayload = {
    sub: user.id,
    role: user.role as JwtAccessPayload["role"],
  };

  const businessProfile = createdBusinessProfile;

  const payload: JwtAccessPayload = businessProfile
    ? { ...payloadBase, businessId: businessProfile.id }
    : payloadBase;

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true, role: true },
  });

  if (!user) throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);

  const ok = await argon2.verify(user.passwordHash, input.password);
  if (!ok) throw new AppError("UNAUTHORIZED", "Invalid credentials", 401);

  const payloadBase: JwtAccessPayload = {
    sub: user.id,
    role: user.role as JwtAccessPayload["role"],
  };

  const businessProfile =
    user.role === "BUSINESS"
      ? await prisma.businessProfile.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
      : null;

  const payload: JwtAccessPayload = businessProfile
    ? { ...payloadBase, businessId: businessProfile.id }
    : payloadBase;

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
}

export function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function issuePasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  // Always respond OK to avoid user enumeration.
  if (!user) return { token: null };

  const token = randomToken();
  passwordResetTokens.set(token, {
    userId: user.id,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return { token };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = passwordResetTokens.get(token);
  if (!record || record.expiresAt < Date.now()) {
    throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
  }

  passwordResetTokens.delete(token);

  const passwordHash = await argon2.hash(newPassword);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });
}

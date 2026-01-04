import jwt from "jsonwebtoken";
import {
  JwtAccessPayloadSchema,
  type JwtAccessPayload,
} from "@savemate/shared-validation";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function signAccessToken(payload: JwtAccessPayload): string {
  const secret = getRequiredEnv("JWT_ACCESS_SECRET");
  const ttlMin = getNumberEnv("ACCESS_TOKEN_TTL_MIN", 15);
  return jwt.sign(payload, secret, { expiresIn: `${ttlMin}m` });
}

export function signRefreshToken(payload: JwtAccessPayload): string {
  const secret = getRequiredEnv("JWT_REFRESH_SECRET");
  const ttlDays = getNumberEnv("REFRESH_TOKEN_TTL_DAYS", 14);
  return jwt.sign(payload, secret, { expiresIn: `${ttlDays}d` });
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const secret = getRequiredEnv("JWT_ACCESS_SECRET");
  const decoded = jwt.verify(token, secret);
  return JwtAccessPayloadSchema.parse(decoded);
}

export function verifyRefreshToken(token: string): JwtAccessPayload {
  const secret = getRequiredEnv("JWT_REFRESH_SECRET");
  const decoded = jwt.verify(token, secret);
  return JwtAccessPayloadSchema.parse(decoded);
}

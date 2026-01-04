import { z } from "zod";

export const RoleSchema = z.enum(["ADMIN", "USER", "BUSINESS"]);
export type Role = z.infer<typeof RoleSchema>;

export const JwtAccessPayloadSchema = z.object({
  sub: z.string(),
  role: RoleSchema,
  businessId: z.string().optional(),
});

export type JwtAccessPayload = z.infer<typeof JwtAccessPayloadSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: RoleSchema.default("USER"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(72),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

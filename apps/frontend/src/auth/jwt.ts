import type { Role } from "@savemate/shared-validation";

export type JwtUser = {
  userId: string;
  role: Role;
  businessId?: string;
};

type JwtAccessPayloadLike = {
  sub?: string;
  userId?: string;
  role?: Role;
  businessId?: string;
};

export function tryDecodeJwtUser(accessToken: string | null): JwtUser | null {
  if (!accessToken) return null;

  const parts = accessToken.split(".");
  if (parts.length !== 3) return null;

  try {
    const payloadBase64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    const json = atob(payloadBase64);
    const payload = JSON.parse(json) as JwtAccessPayloadLike;

    const userId = payload.sub ?? payload.userId;
    if (!userId || !payload.role) return null;

    return {
      userId,
      role: payload.role,
      businessId: payload.businessId,
    };
  } catch {
    return null;
  }
}

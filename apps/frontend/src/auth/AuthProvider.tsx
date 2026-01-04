import { createContext, useEffect, useMemo, useState } from "react";

import type { Role } from "@savemate/shared-validation";
import { logout as apiLogout } from "@/api/auth";
import {
  getAccessToken,
  setAccessToken as setStoredAccessToken,
  subscribeAccessToken,
} from "@/features/auth/authStore";
import { tryDecodeJwtUser, type JwtUser } from "./jwt";

type AuthState = {
  accessToken: string | null;
  user: JwtUser | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() =>
    getAccessToken()
  );

  const user = useMemo(() => tryDecodeJwtUser(accessToken), [accessToken]);

  function setAccessToken(token: string | null) {
    setStoredAccessToken(token);
  }

  function logout() {
    void apiLogout().catch(() => {
      // ignore
    });
    setStoredAccessToken(null);
  }

  function isRole(...roles: Role[]) {
    return !!user && roles.includes(user.role);
  }

  useEffect(
    () => subscribeAccessToken(() => setAccessTokenState(getAccessToken())),
    []
  );

  const value: AuthState = {
    accessToken,
    user,
    setAccessToken,
    logout,
    isRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

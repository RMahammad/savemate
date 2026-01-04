import { createContext, useEffect, useMemo, useState } from "react";

import type { Role } from "@savemate/shared-validation";
import { setAccessToken as setAxiosAccessToken } from "../api/axios";
import { tryDecodeJwtUser, type JwtUser } from "./jwt";

type AuthState = {
  accessToken: string | null;
  user: JwtUser | null;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  isRole: (...roles: Role[]) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "savemate.accessToken";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const user = useMemo(() => tryDecodeJwtUser(accessToken), [accessToken]);

  function setAccessToken(token: string | null) {
    setAccessTokenState(token);
    setAxiosAccessToken(token);

    try {
      if (token) localStorage.setItem(STORAGE_KEY, token);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function logout() {
    setAccessToken(null);
  }

  function isRole(...roles: Role[]) {
    return !!user && roles.includes(user.role);
  }

  useEffect(() => {
    setAxiosAccessToken(accessToken);
  }, [accessToken]);

  const value: AuthState = {
    accessToken,
    user,
    setAccessToken,
    logout,
    isRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

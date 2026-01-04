import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import type { Role } from "@savemate/shared-validation";
import { useAuth } from "@/auth/useAuth";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function RoleGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

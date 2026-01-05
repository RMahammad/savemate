import type { RouteObject } from "react-router-dom";

import { AppShellPublic } from "@/components/layout/AppShellPublic";
import { AppShellDashboard } from "@/components/layout/AppShellDashboard";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import { AdminDealsPage } from "@/features/admin/pages/AdminDealsPage";
import { BusinessDashboardPage } from "@/features/business/pages/BusinessDashboardPage";
import { DealDetailsPage } from "@/features/deals/pages/DealDetailsPage";
import { DealsPage } from "@/features/deals/pages/DealsPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShellPublic />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "deals", element: <DealsPage /> },
      { path: "deals/:id", element: <DealDetailsPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot", element: <ForgotPasswordPage /> },
      { path: "reset", element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <AppShellDashboard title="Account" />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <ProfilePage /> }],
  },
  {
    path: "/business",
    element: (
      <ProtectedRoute roles={["BUSINESS"]}>
        <AppShellDashboard title="Business" />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <BusinessDashboardPage /> }],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["ADMIN"]}>
        <AppShellDashboard title="Admin" />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: "deals", element: <AdminDealsPage /> },
    ],
  },
];

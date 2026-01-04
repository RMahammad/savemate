import type { RouteObject } from "react-router-dom";

import { AppShellPublic } from "@/components/layout/AppShellPublic";
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
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot", element: <ForgotPasswordPage /> },
      { path: "reset", element: <ResetPasswordPage /> },
    ],
  },
];

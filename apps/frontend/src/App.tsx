import { useMemo } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppProviders } from "@/app/providers";
import { routes } from "@/app/router";

export function App() {
  const router = useMemo(() => createBrowserRouter(routes), []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

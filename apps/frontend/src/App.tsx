import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { queryClient } from "./api/reactQuery";
import { AuthProvider } from "./auth/AuthProvider";
import { routes } from "./routes/router";

export function App() {
  const router = useMemo(() => createBrowserRouter(routes), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

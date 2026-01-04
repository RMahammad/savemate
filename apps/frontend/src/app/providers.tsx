import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/app/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppToaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <AppToaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

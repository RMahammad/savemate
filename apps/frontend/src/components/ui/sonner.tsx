import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg",
          title: "text-sm font-medium",
          description: "text-sm text-slate-600",
        },
      }}
    />
  );
}

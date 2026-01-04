import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">
              Something went wrong
            </div>
            <div className="mt-1 text-sm text-slate-600">{message}</div>

            {onRetry ? (
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

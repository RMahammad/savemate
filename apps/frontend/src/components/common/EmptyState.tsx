import type { ReactNode } from "react";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
            {icon ?? <SearchX className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            {description ? (
              <div className="mt-1 text-sm text-slate-600">{description}</div>
            ) : null}

            {actionLabel && onAction ? (
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={onAction}>
                  {actionLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

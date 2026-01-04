import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonDealCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>

          <div className="w-28 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

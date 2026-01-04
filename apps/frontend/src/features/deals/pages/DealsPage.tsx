import { DealCard } from "@/components/common/DealCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MotionFade } from "@/components/common/Motion";
import { Pagination } from "@/components/common/Pagination";
import { SkeletonDealCard } from "@/components/common/SkeletonDealCard";
import { FilterDrawer } from "@/components/deals/FilterDrawer";
import { FilterSidebar } from "@/components/deals/FilterSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useDealsFeed } from "@/features/deals/useDealsFeed";
import { useDealsQuery } from "@/features/deals/hooks/useDealsQuery";
import { useState } from "react";

export function DealsPage() {
  const { query, searchKey, setParam, clearAll } = useDealsQuery();
  const [isClearOpen, setIsClearOpen] = useState(false);

  const deals = useDealsFeed(searchKey, {
    page: query.page,
    limit: query.limit,
    q: query.q,
    city: query.city,
    voivodeship: query.voivodeship,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    discountMin: query.discountMin,
    tags:
      typeof query.tags === "string"
        ? query.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : query.tags,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    sort: query.sort,
  });

  const data = deals.data;

  return (
    <MotionFade className="space-y-4">
      <ConfirmDialog
        open={isClearOpen}
        onOpenChange={setIsClearOpen}
        title="Clear all filters?"
        description="This will reset your filters and sorting to defaults."
        confirmText="Clear"
        onConfirm={() => {
          clearAll();
          toast.success("Filters cleared");
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Deals</h1>
          <div className="mt-1 text-sm text-slate-600">
            Browse and filter current offers.
          </div>
        </div>

        <FilterDrawer query={query} onChange={setParam} onClear={clearAll} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
        <aside className="hidden md:block">
          <Card>
            <CardContent className="pt-6">
              <FilterSidebar
                query={query}
                onChange={setParam}
                onClear={clearAll}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4">
          <Pagination
            page={data?.page.page ?? query.page}
            totalPages={data?.page.totalPages}
            onPageChange={(p) => setParam({ page: String(p) }, false)}
          />

          {deals.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonDealCard key={i} />
              ))}
            </div>
          ) : null}

          {deals.isError ? (
            <ErrorState
              message={deals.error.error.message}
              onRetry={deals.refetch}
            />
          ) : null}

          {deals.isSuccess && data && data.items.length === 0 ? (
            <EmptyState
              title="No deals found"
              description="Try adjusting your filters or clearing them."
              actionLabel="Clear filters"
              onAction={() => setIsClearOpen(true)}
            />
          ) : null}

          {deals.isSuccess && data && data.items.length > 0 ? (
            <div className="space-y-3">
              {data.items.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </MotionFade>
  );
}

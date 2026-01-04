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
import { formatDealsSortLabel } from "@/features/deals/sort";
import { X } from "lucide-react";
import { useState } from "react";

export function DealsPage() {
  const { query, searchKey, setParam, clearAll } = useDealsQuery();
  const [isClearOpen, setIsClearOpen] = useState(false);

  const activeChips: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (query.q) {
    activeChips.push({
      key: "q",
      label: `Search: ${query.q}`,
      onRemove: () => setParam({ q: undefined }),
    });
  }

  if (query.city) {
    activeChips.push({
      key: "city",
      label: `City: ${query.city}`,
      onRemove: () => setParam({ city: undefined }),
    });
  }

  if (query.voivodeship) {
    activeChips.push({
      key: "voivodeship",
      label: `Voivodeship: ${query.voivodeship}`,
      onRemove: () => setParam({ voivodeship: undefined }),
    });
  }

  if (query.minPrice != null) {
    activeChips.push({
      key: "minPrice",
      label: `Min: ${query.minPrice} PLN`,
      onRemove: () => setParam({ minPrice: undefined }),
    });
  }

  if (query.maxPrice != null) {
    activeChips.push({
      key: "maxPrice",
      label: `Max: ${query.maxPrice} PLN`,
      onRemove: () => setParam({ maxPrice: undefined }),
    });
  }

  if (query.discountMin != null) {
    activeChips.push({
      key: "discountMin",
      label: `Discount ≥ ${query.discountMin}%`,
      onRemove: () => setParam({ discountMin: undefined }),
    });
  }

  const tagsLabel =
    typeof query.tags === "string"
      ? query.tags
      : Array.isArray(query.tags)
        ? query.tags.join(",")
        : "";
  if (tagsLabel) {
    activeChips.push({
      key: "tags",
      label: `Tags: ${tagsLabel}`,
      onRemove: () => setParam({ tags: undefined }),
    });
  }

  if (query.dateFrom) {
    activeChips.push({
      key: "dateFrom",
      label: `From: ${query.dateFrom.slice(0, 10)}`,
      onRemove: () => setParam({ dateFrom: undefined }),
    });
  }

  if (query.dateTo) {
    activeChips.push({
      key: "dateTo",
      label: `To: ${query.dateTo.slice(0, 10)}`,
      onRemove: () => setParam({ dateTo: undefined }),
    });
  }

  if (query.sort && query.sort !== "newest") {
    activeChips.push({
      key: "sort",
      label: `Sort: ${formatDealsSortLabel(query.sort)}`,
      onRemove: () => setParam({ sort: undefined }),
    });
  }

  const hasActiveFilters = activeChips.length > 0;

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
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-medium text-slate-600">
                Active filters:
              </div>

              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-xs font-medium text-slate-900 hover:bg-slate-50"
                  title="Remove filter"
                >
                  <span className="max-w-[220px] truncate">{chip.label}</span>
                  <X className="h-3.5 w-3.5 text-slate-500" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsClearOpen(true)}
                className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Clear all
              </button>
            </div>
          ) : null}

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

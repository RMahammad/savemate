import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { VoivodeshipSchema } from "@savemate/shared-validation";
import { DealCard } from "@/components/common/DealCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SkeletonDealCard } from "@/components/common/SkeletonDealCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDealsFeed,
  type DealsFeedQuery,
} from "../features/deals/useDealsFeed";

type Voivodeship = (typeof VoivodeshipSchema.options)[number];

function parseNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseTags(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

function formatTags(tags: string[] | undefined) {
  return (tags ?? []).join(",");
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchKey = searchParams.toString();

  const query: DealsFeedQuery = useMemo(() => {
    const sp = new URLSearchParams(searchKey);
    const page = clampInt(parseNumber(sp.get("page")) ?? 1, 1, 10_000);
    const limit = clampInt(parseNumber(sp.get("limit")) ?? 10, 1, 100);

    const sort = (sp.get("sort") ?? "") as DealsFeedQuery["sort"];

    const q = sp.get("q") ?? undefined;
    const city = sp.get("city") ?? undefined;
    const voivodeshipRaw = sp.get("voivodeship") ?? undefined;
    const voivodeship =
      voivodeshipRaw &&
      (VoivodeshipSchema.options as readonly string[]).includes(voivodeshipRaw)
        ? (voivodeshipRaw as Voivodeship)
        : undefined;

    const minPrice = parseNumber(sp.get("minPrice"));
    const maxPrice = parseNumber(sp.get("maxPrice"));
    const discountMin = parseNumber(sp.get("discountMin"));

    const tags = parseTags(sp.get("tags"));

    const dateFrom = sp.get("dateFrom") ?? undefined;
    const dateTo = sp.get("dateTo") ?? undefined;

    return {
      page,
      limit,
      q: q || undefined,
      city: city || undefined,
      voivodeship: voivodeship || undefined,
      minPrice,
      maxPrice,
      discountMin,
      tags,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sort: sort || undefined,
    };
  }, [searchKey]);

  const deals = useDealsFeed(searchKey, query);

  function setParam(
    next: Record<string, string | undefined>,
    resetPage = true
  ) {
    const sp = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(next)) {
      if (!value) sp.delete(key);
      else sp.set(key, value);
    }

    if (resetPage) sp.set("page", "1");

    setSearchParams(sp);
  }

  const data = deals.data;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Deals</h1>

      <div className="rounded border border-slate-200 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <div className="text-sm text-slate-700">Search</div>
            <Input
              value={query.q ?? ""}
              onChange={(e) => setParam({ q: e.target.value || undefined })}
              className="mt-1"
              placeholder="e.g. coffee"
              type="text"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">City</div>
            <Input
              value={query.city ?? ""}
              onChange={(e) => setParam({ city: e.target.value || undefined })}
              className="mt-1"
              placeholder="e.g. Warsaw"
              type="text"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Voivodeship</div>
            <select
              value={query.voivodeship ?? ""}
              onChange={(e) =>
                setParam({ voivodeship: e.target.value || undefined })
              }
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Any</option>
              {VoivodeshipSchema.options.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Min price</div>
            <Input
              value={query.minPrice ?? ""}
              onChange={(e) =>
                setParam({
                  minPrice: e.target.value ? String(e.target.value) : undefined,
                })
              }
              className="mt-1"
              type="number"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Max price</div>
            <Input
              value={query.maxPrice ?? ""}
              onChange={(e) =>
                setParam({
                  maxPrice: e.target.value ? String(e.target.value) : undefined,
                })
              }
              className="mt-1"
              type="number"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Discount min %</div>
            <Input
              value={query.discountMin ?? ""}
              onChange={(e) =>
                setParam({
                  discountMin: e.target.value
                    ? String(e.target.value)
                    : undefined,
                })
              }
              className="mt-1"
              type="number"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Tags (comma separated)</div>
            <Input
              value={formatTags(query.tags)}
              onChange={(e) => setParam({ tags: e.target.value || undefined })}
              className="mt-1"
              placeholder="e.g. food,discount"
              type="text"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Sort</div>
            <select
              value={query.sort ?? ""}
              onChange={(e) => setParam({ sort: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Default</option>
              <option value="newest">Newest</option>
              <option value="biggestDiscount">Biggest discount</option>
              <option value="lowestPrice">Lowest price</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Valid from</div>
            <Input
              value={query.dateFrom ?? ""}
              onChange={(e) =>
                setParam({ dateFrom: e.target.value || undefined })
              }
              className="mt-1"
              type="date"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Valid to</div>
            <Input
              value={query.dateTo ?? ""}
              onChange={(e) =>
                setParam({ dateTo: e.target.value || undefined })
              }
              className="mt-1"
              type="date"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {data?.page.page ?? query.page} /{" "}
            {data?.page.totalPages ?? "…"}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Limit
              <select
                value={String(query.limit)}
                onChange={(e) => setParam({ limit: e.target.value }, true)}
                className="rounded border border-slate-300 px-2 py-1"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>

            <Button
              type="button"
              disabled={query.page <= 1}
              onClick={() => setParam({ page: String(query.page - 1) }, false)}
              variant="secondary"
              size="sm"
            >
              Prev
            </Button>
            <Button
              type="button"
              disabled={!!data && query.page >= data.page.totalPages}
              onClick={() => setParam({ page: String(query.page + 1) }, false)}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {deals.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonDealCard key={i} />
          ))}
        </div>
      )}

      {deals.isError && (
        <ErrorState
          message={deals.error.error.message}
          onRetry={deals.refetch}
        />
      )}

      {deals.isSuccess && data && data.items.length === 0 && (
        <EmptyState
          title="No deals found"
          description="Try adjusting your filters or search query."
        />
      )}

      {deals.isSuccess && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}

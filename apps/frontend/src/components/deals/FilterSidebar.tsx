import {
  VoivodeshipSchema,
  type DealsQuery,
} from "@savemate/shared-validation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEALS_SORT_OPTIONS,
  formatDealsSortLabel,
} from "@/features/deals/sort";

function formatTags(tags: DealsQuery["tags"]) {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(",");
  return tags;
}

export function FilterSidebar({
  query,
  onChange,
  onClear,
}: {
  query: DealsQuery;
  onChange: (next: Record<string, string | undefined>) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Filters</div>
        <Button variant="ghost" size="sm" type="button" onClick={onClear}>
          Clear
        </Button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <div className="text-sm text-slate-700">Search</div>
          <Input
            className="mt-1"
            value={query.q ?? ""}
            onChange={(e) => onChange({ q: e.target.value || undefined })}
            placeholder="e.g. coffee"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">City</div>
          <Input
            className="mt-1"
            value={query.city ?? ""}
            onChange={(e) => onChange({ city: e.target.value || undefined })}
            placeholder="e.g. Warsaw"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">Voivodeship</div>
          <select
            value={query.voivodeship ?? ""}
            onChange={(e) =>
              onChange({ voivodeship: e.target.value || undefined })
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <option value="">Any</option>
            {VoivodeshipSchema.options.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm text-slate-700">Min price</div>
            <Input
              className="mt-1"
              value={query.minPrice ?? ""}
              onChange={(e) =>
                onChange({ minPrice: e.target.value || undefined })
              }
              type="number"
              inputMode="decimal"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Max price</div>
            <Input
              className="mt-1"
              value={query.maxPrice ?? ""}
              onChange={(e) =>
                onChange({ maxPrice: e.target.value || undefined })
              }
              type="number"
              inputMode="decimal"
            />
          </label>
        </div>

        <label className="block">
          <div className="text-sm text-slate-700">Discount min %</div>
          <Input
            className="mt-1"
            value={query.discountMin ?? ""}
            onChange={(e) =>
              onChange({ discountMin: e.target.value || undefined })
            }
            type="number"
            inputMode="decimal"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">Tags</div>
          <Input
            className="mt-1"
            value={formatTags(query.tags)}
            onChange={(e) => onChange({ tags: e.target.value || undefined })}
            placeholder="food,discount"
          />
        </label>

        <label className="block">
          <div className="text-sm text-slate-700">Sort</div>
          <select
            value={query.sort ?? "newest"}
            onChange={(e) => onChange({ sort: e.target.value || undefined })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {DEALS_SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {formatDealsSortLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm text-slate-700">Valid from</div>
            <Input
              className="mt-1"
              value={query.dateFrom ? query.dateFrom.slice(0, 10) : ""}
              onChange={(e) =>
                onChange({ dateFrom: e.target.value || undefined })
              }
              type="date"
            />
          </label>

          <label className="block">
            <div className="text-sm text-slate-700">Valid to</div>
            <Input
              className="mt-1"
              value={query.dateTo ? query.dateTo.slice(0, 10) : ""}
              onChange={(e) =>
                onChange({ dateTo: e.target.value || undefined })
              }
              type="date"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

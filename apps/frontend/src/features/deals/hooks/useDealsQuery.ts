import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { DealsQuerySchema, type DealsQuery } from "@savemate/shared-validation";

function toIsoStartOfDay(value: string) {
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : value;
}

function toIsoEndOfDay(value: string) {
  const d = new Date(`${value}T23:59:59.999Z`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : value;
}

function normalizeDateMaybe(value: string | null, which: "from" | "to") {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return which === "from" ? toIsoStartOfDay(value) : toIsoEndOfDay(value);
  }
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : value;
}

export function useDealsQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchKey = searchParams.toString();

  const query: DealsQuery = useMemo(() => {
    const sp = new URLSearchParams(searchKey);

    const tagsAll = sp.getAll("tags").filter(Boolean);
    const tags = tagsAll.length > 1 ? tagsAll : (sp.get("tags") ?? undefined);

    const raw: Record<string, unknown> = {
      page: sp.get("page") ?? undefined,
      // Public deals feed default page size
      limit: sp.get("limit") ?? "10",
      q: sp.get("q") ?? undefined,
      city: sp.get("city") ?? undefined,
      categoryId: sp.get("categoryId") ?? undefined,
      voivodeship: sp.get("voivodeship") ?? undefined,
      minPrice: sp.get("minPrice") ?? undefined,
      maxPrice: sp.get("maxPrice") ?? undefined,
      discountMin: sp.get("discountMin") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      tags,
      dateFrom: normalizeDateMaybe(sp.get("dateFrom"), "from"),
      dateTo: normalizeDateMaybe(sp.get("dateTo"), "to"),
    };

    const parsed = DealsQuerySchema.safeParse(raw);
    if (parsed.success) return parsed.data;

    // Fall back to defaults (ignore invalid URL state)
    return DealsQuerySchema.parse({ limit: 10 });
  }, [searchKey]);

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

  function clearAll() {
    setSearchParams({});
  }

  return {
    query,
    searchKey,
    setParam,
    clearAll,
  };
}

export const DEALS_SORT_OPTIONS = [
  "newest",
  "biggestDiscount",
  "lowestPrice",
] as const;

export type DealsSort = (typeof DEALS_SORT_OPTIONS)[number];

export const DEALS_SORT_LABELS = {
  newest: "Newest",
  biggestDiscount: "Biggest discount",
  lowestPrice: "Lowest price",
} satisfies Record<DealsSort, string>;

export function formatDealsSortLabel(sort: DealsSort): string {
  return DEALS_SORT_LABELS[sort];
}

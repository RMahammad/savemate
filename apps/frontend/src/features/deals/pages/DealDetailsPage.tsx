import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { FaqSection } from "@/components/common/FaqSection";
import { MotionFade } from "@/components/common/Motion";
import { PriceBlock } from "@/components/common/PriceBlock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoriesListResponse } from "@/api/categories";
import { listCategories } from "@/api/categories";
import type { DealGetResponse } from "@/api/deals";
import { getDeal } from "@/api/deals";
import { defaultFaqItems } from "@/content/faq";
import type { DealsFeedResponse } from "@/features/deals/useDealsFeed";
import { formatVoivodeshipLabel } from "@/lib/poland";
import {
  Calendar,
  FileText,
  Hash,
  Layers,
  MapPin,
  ScrollText,
  Tag,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DealFromFeed = DealsFeedResponse["items"][number];
type DealDetailsModel = DealFromFeed | DealGetResponse;

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function formatMoneyPLN(value: number) {
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} PLN`;
  }
}

function findDealInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
): DealFromFeed | undefined {
  const entries = queryClient.getQueriesData<DealsFeedResponse>({
    queryKey: ["deals"],
  });

  for (const [, data] of entries) {
    const found = data?.items?.find((d) => d.id === id);
    if (found) return found;
  }
  return undefined;
}

export function DealDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const dealFromState = (location.state as { deal?: DealFromFeed } | null)
    ?.deal;
  const dealFromCache =
    (id && dealFromState?.id === id ? dealFromState : undefined) ??
    (id ? findDealInCache(queryClient, id) : undefined);

  const dealQuery = useQuery<DealGetResponse>({
    queryKey: ["deal", id],
    queryFn: () => getDeal(id as string),
    enabled: Boolean(id) && !dealFromCache,
    staleTime: 2 * 60_000,
  });

  const deal: DealDetailsModel | undefined = dealFromCache ?? dealQuery.data;

  const categoriesQuery = useQuery<CategoriesListResponse>({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    staleTime: 5 * 60_000,
  });

  const category = categoriesQuery.data?.items.find(
    (c) => c.id === deal?.categoryId
  );

  const fallbackEmpty = (
    <EmptyState
      title="Deal not available"
      description="This deal isn’t available right now. Go back to the deals list and open it from there."
      actionLabel="Browse deals"
      onAction={() => navigate("/deals")}
    />
  );

  const loadingSkeleton = (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </CardContent>
    </Card>
  );

  if (!id) {
    return <MotionFade>{fallbackEmpty}</MotionFade>;
  }

  if (dealQuery.isLoading && !deal) {
    return <MotionFade>{loadingSkeleton}</MotionFade>;
  }

  if (!deal) {
    return <MotionFade>{fallbackEmpty}</MotionFade>;
  }

  return (
    <MotionFade>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/deals">← Back to deals</Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          {deal.imageUrl ? (
            <div className="bg-slate-100">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="h-56 w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-2xl tracking-tight">
                    {deal.title}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {deal.city} • {formatVoivodeshipLabel(deal.voivodeship)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(deal.validFrom)} – {formatDate(deal.validTo)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={deal.status} />
                  {deal.discountPercent ? (
                    <Badge variant="secondary">-{deal.discountPercent}%</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
          </div>

          <CardContent className="pt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <div className="rounded-lg border border-sky-200 bg-sky-50 p-1.5 text-sky-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      Description
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                      {deal.description}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-1.5 text-violet-700">
                        <ScrollText className="h-4 w-4" />
                      </div>
                      Usage terms
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {deal.usageTerms ? (
                      <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {deal.usageTerms}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No usage terms provided.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700">
                        <Wallet className="h-4 w-4" />
                      </div>
                      Price summary
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">Price</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {formatMoneyPLN(deal.price)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">Original</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {formatMoneyPLN(deal.originalPrice)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">You save</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {formatMoneyPLN(
                            Math.max(0, deal.originalPrice - deal.price)
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700">
                        <Tag className="h-4 w-4" />
                      </div>
                      Tags
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {deal.tags.length ? (
                        deal.tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500">No tags</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-700">
                        <Hash className="h-4 w-4" />
                      </div>
                      Details
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">Deal id</div>
                        <div className="mt-1 truncate font-mono text-xs text-slate-900">
                          {deal.id}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs text-slate-500">Category</div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-1.5 text-indigo-700">
                            <Layers className="h-4 w-4" />
                          </div>

                          {category ? (
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {category.name}
                            </div>
                          ) : categoriesQuery.isLoading ? (
                            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                          ) : categoriesQuery.isError ? (
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                Category unavailable
                              </div>
                              <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                                ID: {deal.categoryId}
                              </div>
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                Unknown category
                              </div>
                              <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                                ID: {deal.categoryId}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:sticky lg:top-20">
                <Card>
                  <CardHeader className="py-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Price
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <PriceBlock
                      price={deal.price}
                      originalPrice={deal.originalPrice}
                      discountPercent={deal.discountPercent}
                    />
                    <div className="mt-4 text-xs text-slate-500">
                      Valid {formatDate(deal.validFrom)} –{" "}
                      {formatDate(deal.validTo)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <FaqSection
          items={defaultFaqItems}
          title="FAQ"
          description="Answers about browsing and sorting deals."
        />
      </div>
    </MotionFade>
  );
}

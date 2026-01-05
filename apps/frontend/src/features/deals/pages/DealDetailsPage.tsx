import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { MotionFade } from "@/components/common/Motion";
import { PriceBlock } from "@/components/common/PriceBlock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DealsFeedResponse } from "@/features/deals/useDealsFeed";
import { formatVoivodeshipLabel } from "@/lib/poland";
import { Calendar, Hash, MapPin, Tag, Wallet } from "lucide-react";

type DealFromFeed = DealsFeedResponse["items"][number];

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
  const deal =
    (id && dealFromState?.id === id ? dealFromState : undefined) ??
    (id ? findDealInCache(queryClient, id) : undefined);

  return (
    <MotionFade>
      {!id || !deal ? (
        <EmptyState
          title="Deal not available"
          description="This deal isn’t in your current session. Go back to the deals list and open it from there."
          actionLabel="Browse deals"
          onAction={() => navigate("/deals")}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/deals">← Back to deals</Link>
            </Button>
          </div>

          <Card className="overflow-hidden">
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
                        {formatDate(deal.validFrom)} –{" "}
                        {formatDate(deal.validTo)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={deal.status} />
                    {deal.discountPercent ? (
                      <Badge variant="secondary">
                        -{deal.discountPercent}%
                      </Badge>
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
                        <Wallet className="h-4 w-4" />
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
                        <Tag className="h-4 w-4" />
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
                        <Hash className="h-4 w-4" />
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
                          <div className="mt-1 truncate font-mono text-xs text-slate-900">
                            {deal.categoryId}
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
        </div>
      )}
    </MotionFade>
  );
}

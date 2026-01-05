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

type DealFromFeed = DealsFeedResponse["items"][number];

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
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
        <div className="space-y-4">
          <div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/deals">← Back to deals</Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-xl">{deal.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={deal.status} />
                  <Badge variant="secondary">
                    {formatVoivodeshipLabel(deal.voivodeship)}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-slate-600">
                {deal.city} • Valid {formatDate(deal.validFrom)} –{" "}
                {formatDate(deal.validTo)}
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm text-slate-700">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
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

                  <div className="mt-5 text-xs text-slate-500">
                    Deal id: <span className="font-mono">{deal.id}</span>
                  </div>
                </div>

                <PriceBlock
                  price={deal.price}
                  originalPrice={deal.originalPrice}
                  discountPercent={deal.discountPercent}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MotionFade>
  );
}

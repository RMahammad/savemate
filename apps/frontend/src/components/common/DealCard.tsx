import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceBlock } from "@/components/common/PriceBlock";
import { formatVoivodeshipLabel } from "@/lib/poland";

export type DealCardModel = {
  id: string;
  title: string;
  city: string;
  voivodeship: string;
  price: number;
  originalPrice: number;
  discountPercent?: number;
  tags: string[];
  validFrom: string;
  validTo: string;
  status?: string;
};

export function DealCard({ deal }: { deal: DealCardModel }) {
  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <Link
              to={`/deals/${deal.id}`}
              className="block text-sm font-semibold text-slate-900 hover:underline"
            >
              {deal.title}
            </Link>

            <div className="mt-1 text-sm text-slate-600">
              {deal.city} • {formatVoivodeshipLabel(deal.voivodeship)}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {deal.tags.slice(0, 6).map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Valid {new Date(deal.validFrom).toLocaleDateString()} –{" "}
              {new Date(deal.validTo).toLocaleDateString()}
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
  );
}

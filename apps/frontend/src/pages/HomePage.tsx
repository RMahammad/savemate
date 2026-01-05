import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { DealCard } from "@/components/common/DealCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FaqSection } from "@/components/common/FaqSection";
import { SkeletonDealCard } from "@/components/common/SkeletonDealCard";
import { defaultFaqItems } from "@/content/faq";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDealsFeed } from "@/features/deals/useDealsFeed";
import type { LucideIcon } from "lucide-react";

import { Filter, ShieldCheck, Sparkles } from "lucide-react";

type DealsParams = Record<string, string | undefined>;

const popularChips: Array<{
  label: string;
  params: DealsParams;
  className: string;
}> = [
  {
    label: "Coffee",
    params: { q: "coffee" },
    className: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
  {
    label: "Groceries",
    params: { q: "groceries" },
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  {
    label: "Pharmacy",
    params: { q: "pharmacy" },
    className: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
  },
  {
    label: "Warsaw",
    params: { city: "Warsaw" },
    className:
      "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
];

const infoCards: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
}> = [
  {
    title: "Fast filters",
    description: "Narrow by city, price, tags, and discount.",
    Icon: Filter,
    cardClassName: "bg-gradient-to-br from-white/80 to-indigo-50/60 pb-4",
    iconClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    title: "Fresh offers",
    description: "Discover new deals as they get published.",
    Icon: Sparkles,
    cardClassName: "bg-gradient-to-br from-white/80 to-amber-50/60 pb-4",
    iconClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "Trusted listings",
    description: "Verified details and validity dates.",
    Icon: ShieldCheck,
    cardClassName: "bg-gradient-to-br from-white/80 to-emerald-50/60 pb-4",
    iconClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
];

const pricingPlans: Array<{
  title: string;
  price: string;
  subtitle: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  ctaVariant: "default" | "secondary";
  cardClassName?: string;
  badge?: {
    label: string;
    variant: "success" | "warning" | "danger" | "default" | "secondary";
  };
}> = [
  {
    title: "Free",
    price: "0 PLN",
    subtitle: "For browsing deals",
    bullets: ["Search + filters", "Deal details", "Save time on shopping"],
    ctaLabel: "Get started",
    ctaHref: "/deals",
    ctaVariant: "secondary",
  },
  {
    title: "Business",
    price: "49 PLN",
    subtitle: "Per month",
    bullets: ["Publish deals", "Manage your listings", "Reach local shoppers"],
    ctaLabel: "Create account",
    ctaHref: "/register",
    ctaVariant: "default",
    cardClassName: "border-indigo-200 bg-indigo-50/30",
    badge: { label: "Most popular", variant: "success" },
  },
  {
    title: "Enterprise",
    price: "Custom",
    subtitle: "For larger teams",
    bullets: [
      "Multi-location support",
      "Priority moderation",
      "Custom integrations",
    ],
    ctaLabel: "Contact sales",
    ctaHref: "/register",
    ctaVariant: "secondary",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function dealsHref(params: DealsParams) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) sp.set(key, value);
    }
    const qs = sp.toString();
    return `/deals${qs ? `?${qs}` : ""}`;
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString().slice(0, 10);

  const trending = useDealsFeed("home-trending?sort=newest&limit=8", {
    page: 1,
    limit: 8,
    sort: "newest",
  });

  const data = trending.data;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur md:p-10">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Find great deals near you
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Search by product or city, then filter by price and discount.
            </p>

            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                navigate(dealsHref({ q }));
              }}
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deals (e.g. coffee, Warsaw)"
              />

              <div className="flex gap-2">
                <Button type="submit">Search</Button>
                <Button asChild variant="secondary">
                  <Link to="/deals">Browse deals</Link>
                </Button>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs font-medium text-slate-600">
                  Popular:
                </div>
                {popularChips.map((item) => (
                  <Button
                    key={item.label}
                    asChild
                    size="sm"
                    variant="secondary"
                    className={`h-8 rounded-full px-3 ${item.className}`}
                  >
                    <Link to={dealsHref(item.params)}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 px-3"
                >
                  <Link to={dealsHref({ sort: "newest" })}>Newest</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 px-3"
                >
                  <Link to={dealsHref({ sort: "biggestDiscount" })}>
                    Biggest discount
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3"
                >
                  <Link to={dealsHref({ maxPrice: "20" })}>Under 20 PLN</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 px-3"
                >
                  <Link to={dealsHref({ dateFrom: weekAgoIso })}>
                    This week
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {infoCards.map(
              ({ title, description, Icon, cardClassName, iconClassName }) => (
                <Card key={title} className={cardClassName}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconClassName}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>{title}</CardTitle>
                        <div className="mt-1 text-sm text-slate-600">
                          {description}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Trending deals</h2>
            <div className="mt-1 text-sm text-slate-600">
              Newest offers, updated frequently.
            </div>
          </div>

          <Button asChild size="sm" variant="secondary">
            <Link to="/deals?sort=newest&limit=8">View all</Link>
          </Button>
        </div>

        {trending.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonDealCard key={i} />
            ))}
          </div>
        ) : null}

        {trending.isError ? (
          <ErrorState
            message={trending.error.error.message}
            onRetry={trending.refetch}
          />
        ) : null}

        {trending.isSuccess && data && data.items.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Check back soon, or browse all deals."
            actionLabel="Browse deals"
            onAction={() => navigate("/deals")}
          />
        ) : null}

        {trending.isSuccess && data && data.items.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Pricing</h2>
          <div className="mt-1 text-sm text-slate-600">
            Start free, upgrade when you need more.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <Card key={plan.title} className={plan.cardClassName}>
              <CardHeader
                className={
                  plan.badge
                    ? "flex flex-row items-start justify-between gap-3"
                    : undefined
                }
              >
                <CardTitle>{plan.title}</CardTitle>
                {plan.badge ? (
                  <Badge variant={plan.badge.variant} className="mt-0.5">
                    {plan.badge.label}
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{plan.price}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {plan.subtitle}
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Button asChild className="w-full" variant={plan.ctaVariant}>
                    <Link to={plan.ctaHref}>{plan.ctaLabel}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <FaqSection items={defaultFaqItems} />
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { DealCard } from "@/components/common/DealCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { SkeletonDealCard } from "@/components/common/SkeletonDealCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDealsFeed } from "@/features/deals/useDealsFeed";
import { ChevronDown, Filter, ShieldCheck, Sparkles } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function dealsHref(params: Record<string, string | undefined>) {
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
                {[
                  {
                    label: "Coffee",
                    params: { q: "coffee" },
                    className:
                      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
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
                    className:
                      "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
                  },
                  {
                    label: "Warsaw",
                    params: { city: "Warsaw" },
                    className:
                      "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
                  },
                ].map((item) => (
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
            <Card className="bg-gradient-to-br from-white/80 to-indigo-50/60 pb-4">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
                    <Filter className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Fast filters</CardTitle>
                    <div className="mt-1 text-sm text-slate-600">
                      Narrow by city, price, tags, and discount.
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-white/80 to-amber-50/60 pb-4">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Fresh offers</CardTitle>
                    <div className="mt-1 text-sm text-slate-600">
                      Discover new deals as they get published.
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-white/80 to-emerald-50/60 pb-4">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle>Trusted listings</CardTitle>
                    <div className="mt-1 text-sm text-slate-600">
                      Verified details and validity dates.
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">0 PLN</div>
              <div className="mt-1 text-sm text-slate-600">
                For browsing deals
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Search + filters</li>
                <li>Deal details</li>
                <li>Save time on shopping</li>
              </ul>
              <div className="mt-5">
                <Button asChild className="w-full" variant="secondary">
                  <Link to="/deals">Get started</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <CardTitle>Business</CardTitle>
              <Badge variant="success" className="mt-0.5">
                Most popular
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">49 PLN</div>
              <div className="mt-1 text-sm text-slate-600">Per month</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Publish deals</li>
                <li>Manage your listings</li>
                <li>Reach local shoppers</li>
              </ul>
              <div className="mt-5">
                <Button asChild className="w-full">
                  <Link to="/register">Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">Custom</div>
              <div className="mt-1 text-sm text-slate-600">
                For larger teams
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>Multi-location support</li>
                <li>Priority moderation</li>
                <li>Custom integrations</li>
              </ul>
              <div className="mt-5">
                <Button asChild className="w-full" variant="secondary">
                  <Link to="/register">Contact sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">FAQ</h2>
          <div className="mt-1 text-sm text-slate-600">
            Quick answers to help you get started.
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              <details className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>How do I find deals in my city?</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">
                  Use the search box on the homepage, or open the Deals page and
                  filter by city/voivodeship.
                </div>
              </details>

              <details className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>Do I need an account to browse deals?</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">
                  No — browsing is free. Create an account if you want business
                  features or access to protected areas.
                </div>
              </details>

              <details className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>What do “Newest” and “Biggest discount” mean?</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">
                  “Newest” sorts by recently published deals. “Biggest discount”
                  prioritizes offers with the highest percentage discount.
                </div>
              </details>

              <details className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>How do businesses publish deals?</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">
                  Register as a Business user, then go to the Business dashboard
                  to create and manage your listings.
                </div>
              </details>

              <details className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>Are deals moderated?</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">
                  Yes — business listings can go through moderation before
                  appearing publicly, and always show validity dates.
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

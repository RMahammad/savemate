import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
  AdminAllDealsQuerySchema,
  AdminRejectSchema,
} from "@savemate/shared-validation";

import { API_BASE_URL } from "@/api/axios";
import { listAllDeals, setDealStatus } from "@/api/admin";
import type { NormalizedError } from "@/api/normalizedError";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { PriceBlock } from "@/components/common/PriceBlock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

type RejectForm = z.infer<typeof AdminRejectSchema>;

function errorMessage(e: unknown, fallback = "Something went wrong") {
  const asNormalized = e as Partial<NormalizedError> | undefined;
  if (asNormalized?.error?.message) return asNormalized.error.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function resolveImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("data:")) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

const STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
] as const;

function DealsSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 md:grid-cols-12">
        <Skeleton className="h-4 w-24 md:col-span-6" />
        <Skeleton className="h-4 w-16 md:col-span-2" />
        <Skeleton className="h-4 w-16 md:col-span-2 md:ml-auto" />
        <Skeleton className="h-4 w-16 md:col-span-2 md:ml-auto" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 items-start gap-3 border-b border-slate-100 px-4 py-4 md:grid-cols-12"
        >
          <div className="flex items-start gap-3 md:col-span-6">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="md:col-span-2 md:ml-auto">
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="md:col-span-2 md:ml-auto">
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDealsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    return AdminAllDealsQuerySchema.parse({ page, limit: 20, sort: "newest" });
  }, [page]);

  const dealsQuery = useQuery({
    queryKey: ["admin", "deals", "all", queryParams],
    queryFn: () => listAllDeals(queryParams),
  });

  const setStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: (typeof STATUSES)[number];
      reason?: string;
    }) => setDealStatus(id, reason ? { status, reason } : { status }),
    onSuccess: () => {
      toast.success("Status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "deals"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(AdminRejectSchema),
    defaultValues: { reason: "" },
    mode: "onTouched",
  });

  const items = dealsQuery.data?.items ?? [];
  const totalPages = dealsQuery.data?.page?.totalPages;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <div className="mt-1 text-sm text-slate-600">
            View all deals and update their status.
          </div>
        </CardHeader>
      </Card>

      {dealsQuery.isLoading ? (
        <DealsSkeleton />
      ) : dealsQuery.isError ? (
        <ErrorState
          message={errorMessage(dealsQuery.error, "Failed to load deals")}
          onRetry={() => dealsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState title="No deals" description="No deals found." />
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600 md:grid-cols-12">
              <div className="md:col-span-6">Deal</div>
              <div className="md:col-span-2">Status</div>
              <div className="md:col-span-2 md:text-right">Price</div>
              <div className="md:col-span-2 md:text-right">Manage</div>
            </div>

            {items.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-1 items-start gap-3 border-b border-slate-100 px-4 py-4 md:grid-cols-12"
              >
                <div className="min-w-0 md:col-span-6">
                  <div className="flex items-start gap-3">
                    {d.imageUrl ? (
                      <img
                        src={resolveImageUrl(d.imageUrl)}
                        alt={d.title}
                        className="h-12 w-12 flex-none rounded-xl border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-12 w-12 flex-none rounded-xl border border-slate-200 bg-slate-50" />
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {d.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {d.description}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <div>
                          {d.city}, {d.voivodeship}
                        </div>
                        <div>
                          Valid: {new Date(d.validFrom).toLocaleDateString()} –{" "}
                          {new Date(d.validTo).toLocaleDateString()}
                        </div>
                        <div className="font-mono">{d.id}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <StatusBadge status={d.status} />
                </div>

                <div className="flex justify-start md:col-span-2 md:justify-end">
                  <PriceBlock
                    price={d.price}
                    originalPrice={d.originalPrice}
                    discountPercent={d.discountPercent}
                  />
                </div>

                <div className="flex items-start justify-start md:col-span-2 md:justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
                        Set status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          disabled={setStatusMutation.isPending}
                          onClick={() => {
                            if (s === "REJECTED") {
                              setRejectingId(d.id);
                              rejectForm.reset({ reason: "" });
                              return;
                            }
                            setStatusMutation.mutate({ id: d.id, status: s });
                          }}
                        >
                          {s}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <AlertDialog
        open={Boolean(rejectingId)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            rejectForm.reset({ reason: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject deal</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason that will be shown to the business.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form
            className="mt-4 space-y-4"
            onSubmit={rejectForm.handleSubmit(async (values) => {
              if (!rejectingId) return;
              await setStatusMutation.mutateAsync({
                id: rejectingId,
                status: "REJECTED",
                reason: values.reason,
              });
              setRejectingId(null);
              rejectForm.reset({ reason: "" });
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <textarea
                id="reason"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                placeholder="e.g. Missing usage terms, unclear validity period, or invalid pricing."
                {...rejectForm.register("reason")}
              />
              {rejectForm.formState.errors.reason?.message ? (
                <div className="text-sm text-red-700">
                  {rejectForm.formState.errors.reason.message}
                </div>
              ) : null}
            </div>

            <AlertDialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRejectingId(null);
                  rejectForm.reset({ reason: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={setStatusMutation.isPending}>
                {setStatusMutation.isPending ? "Rejecting…" : "Reject"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

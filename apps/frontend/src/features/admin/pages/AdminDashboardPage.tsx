import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useLocation } from "react-router-dom";

import {
  AdminDealsQuerySchema,
  AdminRejectSchema,
} from "@savemate/shared-validation";

import {
  approveDeal,
  createCategory,
  deleteCategory,
  listAdminCategories,
  listPendingDeals,
  rejectDeal,
  updateCategory,
} from "@/api/admin";
import { API_BASE_URL } from "@/api/axios";
import type { NormalizedError } from "@/api/normalizedError";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { PriceBlock } from "@/components/common/PriceBlock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

type RejectForm = z.infer<typeof AdminRejectSchema>;

function resolveImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("data:")) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function errorMessage(e: unknown, fallback = "Something went wrong") {
  const asNormalized = e as Partial<NormalizedError> | undefined;
  if (asNormalized?.error?.message) return asNormalized.error.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600 md:grid-cols-12">
        <div className="md:col-span-5">Deal</div>
        <div className="md:col-span-2">Status</div>
        <div className="md:col-span-2 md:text-right">Price</div>
        <div className="md:col-span-3 md:text-right">Actions</div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-4 py-4 md:grid-cols-12"
        >
          <div className="space-y-2 md:col-span-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex justify-start md:col-span-2 md:justify-end">
            <div className="w-28 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="flex gap-2 md:col-span-3 md:justify-end">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

type Category = { id: string; name: string; slug: string };

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [pendingPage, setPendingPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<
    string | null
  >(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const pendingQueryParams = useMemo(() => {
    return AdminDealsQuerySchema.parse({
      page: pendingPage,
      limit: 20,
      sort: "newest",
    });
  }, [pendingPage]);

  const pendingDealsQuery = useQuery({
    queryKey: ["admin", "deals", "pending", pendingQueryParams],
    queryFn: () => listPendingDeals(pendingQueryParams),
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listAdminCategories,
  });

  const approveMutation = useMutation({
    mutationFn: approveDeal,
    onSuccess: () => {
      toast.success("Approved");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "deals", "pending"],
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectDeal(id, { reason }),
    onSuccess: () => {
      toast.success("Rejected");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "deals", "pending"],
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Category created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; slug?: string };
    }) => updateCategory(id, body),
    onSuccess: () => {
      toast.success("Category updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("Category deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(AdminRejectSchema),
    defaultValues: { reason: "" },
    mode: "onTouched",
  });

  const categoryForm = useForm<{ name: string; slug: string }>({
    defaultValues: { name: "", slug: "" },
    mode: "onTouched",
  });

  function startCreateCategory() {
    setEditingCategory(null);
    setShowCategoryForm(true);
    categoryForm.reset({ name: "", slug: "" });
  }

  function startEditCategory(c: Category) {
    setEditingCategory(c);
    setShowCategoryForm(true);
    categoryForm.reset({ name: c.name, slug: c.slug });
  }

  async function submitCategory(values: { name: string; slug: string }) {
    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        id: editingCategory.id,
        body: { name: values.name, slug: values.slug },
      });
    } else {
      await createCategoryMutation.mutateAsync({
        name: values.name,
        slug: values.slug,
      });
    }

    setShowCategoryForm(false);
    setEditingCategory(null);
    categoryForm.reset({ name: "", slug: "" });
  }

  const pending = pendingDealsQuery.data;
  const pendingItems = pending?.items ?? [];
  const pendingTotalPages = pending?.page?.totalPages;

  const categories = (categoriesQuery.data?.items ?? []) as Category[];
  const categoryNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, c.name);
    return m;
  }, [categories]);

  useEffect(() => {
    if (location.hash !== "#categories") return;
    const el = document.getElementById("categories");
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [location.hash]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <div className="mt-1 text-sm text-slate-600">
            Moderate pending deals and manage categories.
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Pending deals
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Approve or reject deals submitted by businesses.
            </div>
          </div>
        </div>

        {pendingDealsQuery.isLoading ? (
          <TableSkeleton />
        ) : pendingDealsQuery.isError ? (
          <ErrorState
            message={errorMessage(
              pendingDealsQuery.error,
              "Failed to load pending deals"
            )}
            onRetry={() => pendingDealsQuery.refetch()}
          />
        ) : pendingItems.length === 0 ? (
          <EmptyState title="No pending deals" description="All caught up." />
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600 md:grid-cols-12">
                <div className="md:col-span-5">Deal</div>
                <div className="md:col-span-2">Status</div>
                <div className="md:col-span-2 md:text-right">Price</div>
                <div className="md:col-span-3 md:text-right">Actions</div>
              </div>

              {pendingItems.map((d) => (
                <div
                  key={d.id}
                  className="grid grid-cols-1 items-start gap-3 border-b border-slate-100 px-4 py-4 md:grid-cols-12"
                >
                  <div className="min-w-0 md:col-span-5">
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
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <div>
                        Location:{" "}
                        <span className="text-slate-700">{d.city}</span>,{" "}
                        <span className="text-slate-700">{d.voivodeship}</span>
                      </div>
                      <div>
                        Category:{" "}
                        <span className="text-slate-700">
                          {categoryNameById.get(d.categoryId) ?? d.categoryId}
                        </span>
                      </div>
                      <div>
                        Valid:{" "}
                        <span className="text-slate-700">
                          {new Date(d.validFrom).toLocaleDateString()} –{" "}
                          {new Date(d.validTo).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        Created:{" "}
                        <span className="text-slate-700">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        Business:{" "}
                        <span className="font-mono">{d.businessId}</span>
                      </div>
                      {d.tags?.length ? (
                        <div className="truncate">
                          Tags:{" "}
                          <span className="text-slate-700">
                            {d.tags.join(", ")}
                          </span>
                        </div>
                      ) : null}
                      {d.imageUrl ? (
                        <div className="text-slate-700">Image: yes</div>
                      ) : null}
                      {d.usageTerms ? (
                        <div className="text-slate-700">
                          Usage terms: provided
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-0.5 md:col-span-2">
                    <StatusBadge status={d.status} />
                  </div>

                  <div className="flex justify-start md:col-span-2 md:justify-end">
                    <PriceBlock
                      price={d.price}
                      originalPrice={d.originalPrice}
                      discountPercent={d.discountPercent}
                    />
                  </div>

                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(d.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setRejectingId(d.id);
                        rejectForm.reset({ reason: "" });
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={pendingPage}
              totalPages={pendingTotalPages}
              onPageChange={(p) => setPendingPage(p)}
            />
          </div>
        )}
      </div>

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
              await rejectMutation.mutateAsync({
                id: rejectingId,
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
              <Button type="submit" disabled={rejectMutation.isPending}>
                {rejectMutation.isPending ? "Rejecting…" : "Reject"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <div id="categories" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Categories
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Create and manage categories.
            </div>
          </div>
          <Button variant="secondary" onClick={startCreateCategory}>
            Create category
          </Button>
        </div>

        <AlertDialog
          open={showCategoryForm}
          onOpenChange={(open) => {
            if (!open) {
              setShowCategoryForm(false);
              setEditingCategory(null);
              categoryForm.reset({ name: "", slug: "" });
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {editingCategory ? "Edit category" : "Create category"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {editingCategory
                  ? "Update the category name and slug."
                  : "Create a new category for deals."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form
              className="mt-4 space-y-4"
              onSubmit={categoryForm.handleSubmit(submitCategory)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="catName">Name</Label>
                  <Input
                    id="catName"
                    placeholder="e.g. Restaurants"
                    {...categoryForm.register("name", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catSlug">Slug</Label>
                  <Input
                    id="catSlug"
                    placeholder="e.g. restaurants"
                    {...categoryForm.register("slug", { required: true })}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    categoryForm.reset({ name: "", slug: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending
                  }
                >
                  {editingCategory
                    ? updateCategoryMutation.isPending
                      ? "Saving…"
                      : "Save"
                    : createCategoryMutation.isPending
                      ? "Creating…"
                      : "Create"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {categoriesQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ) : categoriesQuery.isError ? (
          <ErrorState
            message={errorMessage(
              categoriesQuery.error,
              "Failed to load categories"
            )}
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories"
            description="Create the first category."
            actionLabel="Create category"
            onAction={startCreateCategory}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600 md:grid">
              <div className="col-span-5">Name</div>
              <div className="col-span-5">Slug</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {categories.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-1 items-start gap-3 border-b border-slate-100 px-4 py-4 md:grid-cols-12 md:items-center"
              >
                <div className="text-sm font-medium text-slate-900 md:col-span-5">
                  {c.name}
                </div>
                <div className="truncate font-mono text-xs text-slate-700 md:col-span-5">
                  {c.slug}
                </div>
                <div className="flex flex-wrap justify-start gap-2 md:col-span-2 md:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEditCategory(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteCategoryId(c.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteCategoryId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteCategoryId(null);
        }}
        title="Delete category?"
        description="This action cannot be undone."
        confirmText={deleteCategoryMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        confirmDisabled={deleteCategoryMutation.isPending}
        onConfirm={async () => {
          if (!confirmDeleteCategoryId) return;
          await deleteCategoryMutation.mutateAsync(confirmDeleteCategoryId);
          setConfirmDeleteCategoryId(null);
        }}
      />
    </div>
  );
}

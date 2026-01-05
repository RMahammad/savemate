import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  DealCreateSchema,
  DealImageMimeSchema,
  DealsQuerySchema,
  VoivodeshipSchema,
} from "@savemate/shared-validation";

import {
  createMyDeal,
  deleteMyDeal,
  getMyDeals,
  updateMyDeal,
} from "@/api/business";
import { listCategories } from "@/api/categories";
import type { NormalizedError } from "@/api/normalizedError";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Pagination } from "@/components/common/Pagination";
import { PriceBlock } from "@/components/common/PriceBlock";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { API_BASE_URL } from "@/api/http";

const voivodeships = VoivodeshipSchema.options;

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseTags(tagsText: string) {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function resolveImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

type DealCreateForm = {
  title: string;
  description: string;
  usageTerms?: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  city: string;
  voivodeship: z.infer<typeof VoivodeshipSchema>;
  tagsText?: string;
  validFrom: string;
  validTo: string;
};

type DealRow = {
  id: string;
  title: string;
  description: string;
  usageTerms?: string | null;
  imageUrl?: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  city: string;
  voivodeship: z.infer<typeof VoivodeshipSchema>;
  categoryId: string;
  tags: string[];
  validFrom: string;
  validTo: string;
  createdAt: string;
};

function errorMessage(e: unknown, fallback = "Something went wrong") {
  const asNormalized = e as Partial<NormalizedError> | undefined;
  if (asNormalized?.error?.message) return asNormalized.error.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function DealsTableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-12 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
        <div className="col-span-5">Deal</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3 text-right">Price</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 items-center gap-3 border-b border-slate-100 px-4 py-4"
        >
          <div className="col-span-5 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="col-span-3 flex justify-end">
            <div className="w-28 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BusinessDashboardPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imageState, setImageState] = useState<{
    base64: string;
    mime: z.infer<typeof DealImageMimeSchema>;
  } | null>(null);

  const listQuery = useMemo(() => {
    const parsed = DealsQuerySchema.parse({ page, limit: 20, sort: "newest" });
    return parsed;
  }, [page]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const myDealsQuery = useQuery({
    queryKey: ["business", "deals", listQuery],
    queryFn: () => getMyDeals(listQuery),
  });

  const createMutation = useMutation({
    mutationFn: createMyDeal,
    onSuccess: () => {
      toast.success("Deal created", {
        description: "Your deal was submitted for review.",
      });
      void queryClient.invalidateQueries({ queryKey: ["business", "deals"] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      updateMyDeal(id, body),
    onSuccess: () => {
      toast.success("Deal updated", { description: "Changes saved." });
      void queryClient.invalidateQueries({ queryKey: ["business", "deals"] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyDeal,
    onSuccess: () => {
      toast.success("Deal deleted");
      void queryClient.invalidateQueries({ queryKey: ["business", "deals"] });
    },
    onError: (e) => {
      toast.error(errorMessage(e));
    },
  });

  const form = useForm<DealCreateForm>({
    defaultValues: {
      title: "",
      description: "",
      usageTerms: "",
      price: 0,
      originalPrice: 0,
      categoryId: "",
      city: "",
      voivodeship: "MAZOWIECKIE",
      tagsText: "",
      validFrom: "",
      validTo: "",
    },
    mode: "onTouched",
  });

  const canSubmit =
    !form.formState.isSubmitting &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function startCreate() {
    setEditing(null);
    setShowForm(true);
    setImageState(null);
    form.reset({
      title: "",
      description: "",
      usageTerms: "",
      price: 0,
      originalPrice: 0,
      categoryId: categoriesQuery.data?.items?.[0]?.id ?? "",
      city: "",
      voivodeship: "MAZOWIECKIE",
      tagsText: "",
      validFrom: "",
      validTo: "",
    });
  }

  function startEdit(deal: DealRow) {
    setEditing(deal);
    setShowForm(true);
    setImageState(null);
    form.reset({
      title: deal.title,
      description: deal.description,
      usageTerms: deal.usageTerms ?? "",
      price: deal.price,
      originalPrice: deal.originalPrice,
      categoryId: deal.categoryId,
      city: deal.city,
      voivodeship: deal.voivodeship,
      tagsText: deal.tags.join(", "),
      validFrom: toDatetimeLocalValue(deal.validFrom),
      validTo: toDatetimeLocalValue(deal.validTo),
    });
  }

  async function onSubmit(values: DealCreateForm) {
    form.clearErrors("root");

    const validFromIso = datetimeLocalToIso(values.validFrom);
    const validToIso = datetimeLocalToIso(values.validTo);
    if (!validFromIso) {
      form.setError("validFrom", { message: "Invalid datetime" });
      return;
    }
    if (!validToIso) {
      form.setError("validTo", { message: "Invalid datetime" });
      return;
    }

    const candidate: any = {
      title: values.title,
      description: values.description,
      usageTerms: values.usageTerms?.trim() ? values.usageTerms : undefined,
      price: values.price,
      originalPrice: values.originalPrice,
      categoryId: values.categoryId,
      city: values.city,
      voivodeship: values.voivodeship,
      tags: parseTags(values.tagsText ?? ""),
      validFrom: validFromIso,
      validTo: validToIso,
    };
    if (imageState) {
      candidate.imageBase64 = imageState.base64;
      candidate.imageMime = imageState.mime;
    }

    const parsed = DealCreateSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path?.[0] ?? "");
        if (
          field === "title" ||
          field === "description" ||
          field === "usageTerms" ||
          field === "price" ||
          field === "originalPrice" ||
          field === "categoryId" ||
          field === "city" ||
          field === "voivodeship" ||
          field === "validFrom" ||
          field === "validTo"
        ) {
          form.setError(field as any, { message: issue.message });
        } else if (field === "imageBase64" || field === "imageMime") {
          toast.error(issue.message);
        }
      }
      return;
    }

    const body: any = parsed.data;
    if (imageState) {
      body.imageBase64 = imageState.base64;
      body.imageMime = imageState.mime;
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      setShowForm(false);
      setEditing(null);
      setImageState(null);
      form.reset();
    } catch (e) {
      const err = e as NormalizedError;

      const details = err.error.details as any;
      const fieldErrors = details?.fieldErrors as
        | Record<string, string[]>
        | undefined;
      if (fieldErrors) {
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          if (!msgs?.length) continue;
          // Map backend field errors to our form fields when possible.
          if (key === "validFrom" || key === "validTo") {
            form.setError(key as any, { message: msgs[0] });
          } else if (
            key === "title" ||
            key === "description" ||
            key === "usageTerms" ||
            key === "price" ||
            key === "originalPrice" ||
            key === "categoryId" ||
            key === "city" ||
            key === "voivodeship" ||
            key === "tags"
          ) {
            form.setError(key as any, { message: msgs[0] });
          } else if (key === "imageBase64") {
            toast.error(msgs[0]);
          }
        }
      } else {
        form.setError("root", { message: errorMessage(e) });
      }
    }
  }

  const rootError = (form.formState.errors.root as any)?.message as
    | string
    | undefined;

  const myDeals = myDealsQuery.data;
  const items = (myDeals?.items ?? []) as DealRow[];
  const totalPages = myDeals?.page?.totalPages;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 mb-5">
          <div>
            <CardTitle>My deals</CardTitle>
            <div className="mt-1 text-sm text-slate-600">
              Create, edit, and manage your deals.
            </div>
          </div>
          <Button onClick={startCreate} variant="secondary">
            Create deal
          </Button>
        </CardHeader>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editing ? "Edit deal" : "Create deal"}
            </CardTitle>
            <div className="text-sm text-slate-600">
              {editing
                ? "Update the fields below and save changes."
                : "Fill in the details and submit for review."}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. 30% off coffee"
                    {...form.register("title")}
                  />
                  {form.formState.errors.title?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.title.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    placeholder="What is included? Any important details?"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.description.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="usageTerms">Usage terms (optional)</Label>
                  <textarea
                    id="usageTerms"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    placeholder="e.g. Valid Mon–Fri. One per customer."
                    {...form.register("usageTerms")}
                  />
                  {form.formState.errors.usageTerms?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.usageTerms.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (PLN)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min={0}
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.price.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original price (PLN)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    min={0}
                    {...form.register("originalPrice", { valueAsNumber: true })}
                  />
                  {form.formState.errors.originalPrice?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.originalPrice.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    {...form.register("categoryId")}
                  >
                    <option value="" disabled>
                      Select a category…
                    </option>
                    {(categoriesQuery.data?.items ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.categoryId?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.categoryId.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voivodeship">Voivodeship</Label>
                  <select
                    id="voivodeship"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    {...form.register("voivodeship")}
                  >
                    {voivodeships.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.voivodeship?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.voivodeship.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Warsaw"
                    {...form.register("city")}
                  />
                  {form.formState.errors.city?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.city.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagsText">Tags (comma-separated)</Label>
                  <Input
                    id="tagsText"
                    placeholder="e.g. coffee, breakfast, takeaway"
                    {...form.register("tagsText")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid from</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    {...form.register("validFrom")}
                  />
                  {form.formState.errors.validFrom?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.validFrom.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validTo">Valid to</Label>
                  <Input
                    id="validTo"
                    type="datetime-local"
                    {...form.register("validTo")}
                  />
                  {form.formState.errors.validTo?.message ? (
                    <div className="text-sm text-red-700">
                      {form.formState.errors.validTo.message as any}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="image">Image (optional)</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setImageState(null);
                        return;
                      }

                      const mimeParsed = DealImageMimeSchema.safeParse(
                        file.type
                      );
                      if (!mimeParsed.success) {
                        toast.error("Unsupported image type", {
                          description: "Use PNG, JPG, or WEBP.",
                        });
                        e.target.value = "";
                        setImageState(null);
                        return;
                      }

                      const base64 = await new Promise<string>(
                        (resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () =>
                            resolve(String(reader.result ?? ""));
                          reader.onerror = () =>
                            reject(new Error("Failed to read file"));
                          reader.readAsDataURL(file);
                        }
                      );

                      setImageState({ base64, mime: mimeParsed.data });
                    }}
                  />

                  {editing?.imageUrl ? (
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <img
                        src={resolveImageUrl(editing.imageUrl)}
                        alt="Current"
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900">
                          Current image
                        </div>
                        <div className="text-xs text-slate-600">
                          Upload a new file to replace it.
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {rootError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {rootError}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setImageState(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {editing
                    ? updateMutation.isPending
                      ? "Saving…"
                      : "Save changes"
                    : createMutation.isPending
                      ? "Creating…"
                      : "Create deal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {myDealsQuery.isLoading ? (
        <DealsTableSkeleton />
      ) : myDealsQuery.isError ? (
        <ErrorState
          message={errorMessage(myDealsQuery.error, "Failed to load deals")}
          onRetry={() => myDealsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Create your first deal to get started."
          actionLabel="Create deal"
          onAction={startCreate}
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 px-4 py-3 text-xs font-medium text-slate-600 lg:grid">
              <div className="col-span-5">Deal</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {items.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-1 items-start gap-3 border-b border-slate-100 px-4 py-4 lg:grid-cols-12"
              >
                <div className="min-w-0 lg:col-span-5">
                  <div className="flex items-start gap-3">
                    {d.imageUrl ? (
                      <img
                        src={resolveImageUrl(d.imageUrl)}
                        alt=""
                        className="mt-0.5 h-10 w-10 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mt-0.5 h-10 w-10 rounded-xl border border-slate-200 bg-slate-50" />
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {d.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {d.description}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Valid: {new Date(d.validFrom).toLocaleDateString()} →{" "}
                        {new Date(d.validTo).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-0.5 lg:col-span-2">
                  <StatusBadge status={d.status} />
                </div>

                <div className="flex justify-start lg:col-span-3 lg:justify-end">
                  <PriceBlock
                    price={d.price}
                    originalPrice={d.originalPrice}
                    discountPercent={d.discountPercent}
                  />
                </div>

                <div className="flex flex-wrap justify-start gap-2 lg:col-span-2 lg:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(d)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteId(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Delete deal?"
        description="This action cannot be undone."
        confirmText={deleteMutation.isPending ? "Deleting…" : "Delete"}
        destructive
        confirmDisabled={deleteMutation.isPending}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          await deleteMutation.mutateAsync(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}

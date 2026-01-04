import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number | undefined;
  onPageChange: (page: number) => void;
}) {
  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : true;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-slate-600">
        Page {page} / {totalPages ?? "…"}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

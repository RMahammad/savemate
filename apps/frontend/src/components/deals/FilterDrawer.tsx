import { SlidersHorizontal } from "lucide-react";

import type { DealsQuery } from "@savemate/shared-validation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/deals/FilterSidebar";

export function FilterDrawer({
  query,
  onChange,
  onClear,
}: {
  query: DealsQuery;
  onChange: (next: Record<string, string | undefined>) => void;
  onClear: () => void;
}) {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary" size="sm">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </SheetTrigger>

        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FilterSidebar query={query} onChange={onChange} onClear={onClear} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { ChevronDown, HelpCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { FaqItem } from "@/content/faq";

export function FaqSection({
  title = "FAQ",
  description = "Quick answers to help you get started.",
  items,
}: {
  title?: string;
  description?: string;
  items: FaqItem[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-700">
            <HelpCircle className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="mt-1 text-sm text-slate-600">{description}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {items.map((item) => (
              <details key={item.question} className="group px-6 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 outline-none">
                  <span>{item.question}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 text-sm text-slate-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

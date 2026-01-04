import type { z } from "zod";

import { DealStatusSchema } from "@savemate/shared-validation";

import { Badge } from "@/components/ui/badge";

type DealStatus = z.infer<typeof DealStatusSchema>;

export function StatusBadge({ status }: { status: DealStatus }) {
  switch (status) {
    case "APPROVED":
      return <Badge variant="success">Approved</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "REJECTED":
      return <Badge variant="danger">Rejected</Badge>;
    case "EXPIRED":
      return <Badge variant="secondary">Expired</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

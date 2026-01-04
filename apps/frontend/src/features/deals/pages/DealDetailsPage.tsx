import { useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DealDetailsPage() {
  const { id } = useParams();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-600">
          Deal id: <span className="font-mono text-slate-900">{id}</span>
        </div>
        <div className="mt-3 text-sm text-slate-600">Not available yet.</div>
      </CardContent>
    </Card>
  );
}

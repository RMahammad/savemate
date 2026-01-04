import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/auth/useAuth";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-slate-600">User id:</span>{" "}
          <span className="font-mono">{user?.userId ?? "—"}</span>
        </div>
        <div>
          <span className="text-slate-600">Role:</span>{" "}
          <span className="font-mono">{user?.role ?? "—"}</span>
        </div>
        <div>
          <span className="text-slate-600">Business id:</span>{" "}
          <span className="font-mono">{user?.businessId ?? "—"}</span>
        </div>
      </CardContent>
    </Card>
  );
}

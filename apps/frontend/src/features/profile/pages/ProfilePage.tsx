import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Profile</CardTitle>
            <div className="mt-1 text-sm text-slate-600">
              Your account details from the access token.
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              toast.message("Signed out");
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </Button>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">User id</div>
            <div className="mt-1 truncate font-mono text-xs text-slate-900">
              {user?.userId ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Role</div>
            <div className="mt-1 font-mono text-xs text-slate-900">
              {user?.role ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
            <div className="text-xs text-slate-500">Business id</div>
            <div className="mt-1 truncate font-mono text-xs text-slate-900">
              {user?.businessId ?? "—"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

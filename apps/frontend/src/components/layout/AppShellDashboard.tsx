import { useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();

  const items: Array<{ to: string; label: string; show?: boolean }> = [
    { to: "/profile", label: "Profile", show: !!user },
    { to: "/business", label: "Business", show: user?.role === "BUSINESS" },
    { to: "/admin", label: "Admin", show: user?.role === "ADMIN" },
    { to: "/admin/deals", label: "Deals", show: user?.role === "ADMIN" },
  ];

  return (
    <nav className="space-y-1">
      {items
        .filter((i) => i.show)
        .map((i) => (
          <Button
            key={i.to}
            asChild
            variant="ghost"
            className="w-full justify-start"
            onClick={onNavigate}
          >
            <Link to={i.to}>{i.label}</Link>
          </Button>
        ))}
    </nav>
  );
}

export function AppShellDashboard({ title }: { title?: ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="Open menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <DashboardNav onNavigate={() => setMobileNavOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            <Link to="/" className="text-base font-semibold tracking-tight">
              SaveMate
            </Link>

            {title ? (
              <div className="hidden text-sm text-slate-600 lg:block">
                <Separator
                  orientation="vertical"
                  className="mx-3 inline-block h-5"
                />
                {title}
              </div>
            ) : null}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 lg:block">
          <DashboardNav />
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

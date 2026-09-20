import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Map as MapIcon,
  Users,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/reports", label: "Reports", icon: ClipboardList },
  { to: "/admin/map", label: "GIS Map", icon: MapIcon },
  { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/users", label: "Users", icon: Users },
] as const;

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="glass-card sticky top-24 rounded-2xl p-2">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                activeProps={{ className: "bg-primary-soft text-primary" }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/admin" }}
                activeProps={{ className: "bg-primary-soft text-primary border-primary/25" }}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LayoutDashboard, LogOut, MapPinned, Menu, Plus, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DownloadApkModal } from "@/components/DownloadApkModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { session, isEngineer, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ["notifications-unread", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/dpwh-logo.png"
            alt="DPWH Official Seal"
            className="h-9 w-auto max-w-16 shrink-0 object-contain drop-shadow-xs"
          />
          <span className="flex size-9 items-center justify-center rounded-lg civic-gradient text-primary-foreground shadow-xs">
            <MapPinned className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="flex items-center gap-1.5 font-display text-sm font-semibold">
              Borongan RoadWatch
              <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                DPWH · CEO
              </span>
            </span>
            <span className="block text-[11px] text-muted-foreground">
              City Engineering Office · Eastern Samar
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/notifications">
                  <Bell className="size-4" />
                  Notifications
                  {unread ? (
                    <span className="ml-1 rounded-full bg-severity-critical px-1.5 text-[10px] font-bold text-severity-critical-foreground">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              </Button>
              {isEngineer ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin">Engineering</Link>
                </Button>
              ) : null}
              <Button size="sm" asChild>
                <Link to="/report/new">
                  <Plus className="size-4" /> Submit Report
                </Link>
              </Button>
              <DownloadApkModal
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary">
                    <Smartphone className="size-3.5" /> Get APK
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth" search={{ mode: "login" }}>
                  Login
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "register" }}>
                  Register
                </Link>
              </Button>
            </>
          )}
        </nav>

        <div className="ml-auto md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/report/new">Submit Report</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications">Notifications</Link>
                  </DropdownMenuItem>
                  {isEngineer ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Engineering Dashboard</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DownloadApkModal
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Smartphone className="size-4 mr-2" /> Download Android APK
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/auth" search={{ mode: "login" }}>
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/auth" search={{ mode: "register" }}>
                      Register
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

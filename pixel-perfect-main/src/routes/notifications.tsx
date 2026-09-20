import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Status alerts from the Borongan City Engineering Office about the road damage you reported.",
      },
      { property: "og:title", content: "Notifications | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Status alerts about the road damage you reported.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Notifications />
    </RequireAuth>
  ),
});

function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const unread = items.filter((item) => !item.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread update${unread > 1 ? "s" : ""}` : "You are all caught up."}
            </p>
          </div>
          {unread > 0 ? (
            <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="size-4" /> Mark all as read
            </Button>
          ) : null}
        </div>

        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`glass-card flex gap-3 rounded-2xl p-4 ${
                item.is_read ? "" : "border-primary/30"
              }`}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <BellRing className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">{item.message}</p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  {item.report_id ? (
                    <Link
                      to="/reports/$reportId"
                      params={{ reportId: item.report_id }}
                      className="text-primary hover:underline"
                    >
                      View report
                    </Link>
                  ) : null}
                </div>
              </div>
              {!item.is_read ? (
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
              ) : null}
            </li>
          ))}
          {items.length === 0 ? (
            <li className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
              No notifications yet.
            </li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}

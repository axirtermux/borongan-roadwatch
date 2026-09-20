import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { ReportPhoto } from "@/components/ReportPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, damageLabel, type ReportStatus, type SeverityLevel } from "@/lib/domain";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "My Reports | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Browse every road damage report you submitted to the Borongan City Engineering Office and follow its repair progress.",
      },
      { property: "og:title", content: "My Reports | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Every road damage report you submitted and its repair progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MyReports />
    </RequireAuth>
  ),
});

function MyReports() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["my-reports-all", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = reports.filter((report) => {
    const matchesStatus = status === "all" || report.status === status;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      report.reference_code.toLowerCase().includes(term) ||
      report.road_name.toLowerCase().includes(term) ||
      report.barangay.toLowerCase().includes(term) ||
      report.title.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">My reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every road damage report you submitted, newest first.
            </p>
          </div>
          <Button asChild>
            <Link to="/report/new">
              <Plus className="size-4" /> Submit new report
            </Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, road or barangay"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((report) => (
            <Link
              key={report.id}
              to="/reports/$reportId"
              params={{ reportId: report.id }}
              className="glass-card overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
            >
              <ReportPhoto path={report.photo_url} alt={report.title} className="h-40 w-full" />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {report.reference_code}
                  </span>
                  <StatusBadge status={report.status as ReportStatus} />
                </div>
                <h2 className="line-clamp-1 font-semibold">{report.title}</h2>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {report.road_name}, {report.barangay}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <SeverityBadge severity={report.severity_level as SeverityLevel} />
                  <span className="text-xs text-muted-foreground">
                    {damageLabel(report.damage_type)} ·{" "}
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <div className="glass-card mt-6 rounded-2xl p-12 text-center text-muted-foreground">
            No reports match your filters yet.
          </div>
        ) : null}
      </main>
    </div>
  );
}

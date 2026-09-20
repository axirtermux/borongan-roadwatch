import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardList, Clock, Download, MapPin, ShieldCheck, Smartphone, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import { DownloadApkModal } from "@/components/DownloadApkModal";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { damageLabel, type ReportStatus, type SeverityLevel } from "@/lib/domain";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Engineering Overview | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "City Engineering Office overview of reported road defects, pending verifications and ongoing repairs in Borongan City.",
      },
      { property: "og:title", content: "Engineering Overview | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Overview of reported road defects and ongoing repairs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <AdminOverview />
    </RequireAuth>
  ),
});

export function useAllReports() {
  return useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function AdminOverview() {
  const { data: reports = [] } = useAllReports();

  const pending = reports.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const ongoing = reports.filter((r) => ["scheduled", "in_progress"].includes(r.status)).length;
  const critical = reports.filter(
    (r) => r.severity_level === "critical" && r.status !== "completed",
  ).length;

  const cards = [
    { icon: ClipboardList, label: "Total reports", value: reports.length },
    { icon: Clock, label: "Awaiting verification", value: pending },
    { icon: Wrench, label: "Repairs in the pipeline", value: ongoing },
    { icon: AlertTriangle, label: "Open critical defects", value: critical },
  ];

  return (
    <AdminShell
      title="Engineering overview"
      description="Live picture of road defect reports across Borongan City."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-card rounded-2xl p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <card.icon className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Mobile App & GIS Pipeline Integration Banner */}
      <div className="mt-6 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-background to-amber-500/10 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Smartphone className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-foreground">
                  Cross-Platform Mobile App & Field GIS Integration
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Objective 1 & Scope 1–5: Citizen reports filed via Android smartphone sensor hardware (GPS coordinates & photos)
                automatically synchronize with this engineering dashboard, plotting onto the Interactive GIS Map and Kanban Maintenance Board in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <DownloadApkModal
              trigger={
                <Button size="sm" className="bg-[#FF8200] hover:bg-[#ffa034] text-slate-950 font-bold gap-1.5 shadow-xs">
                  <Smartphone className="size-4" /> Download Android APK
                </Button>
              }
            />
            <Button size="sm" variant="outline" asChild>
              <Link to="/download">Installation Guide</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="glass-card mt-6 rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold">Latest reports</h2>
          <Link to="/admin/reports" className="text-sm text-primary hover:underline">
            Manage all
          </Link>
        </header>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.slice(0, 8).map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs">{report.reference_code}</TableCell>
                  <TableCell>
                    {report.road_name}, {report.barangay}
                  </TableCell>
                  <TableCell>{damageLabel(report.damage_type)}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={report.severity_level as SeverityLevel} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status as ReportStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No reports submitted yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>
    </AdminShell>
  );
}

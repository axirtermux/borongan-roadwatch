import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { ReportPhoto } from "@/components/ReportPhoto";
import { ClientMap } from "@/components/map/ClientMap";
import { Button } from "@/components/ui/button";
import {
  SEVERITY_HEX,
  WORKFLOW,
  damageLabel,
  statusLabel,
  type ReportStatus,
  type SeverityLevel,
} from "@/lib/domain";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report Details | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Follow the verification, scheduling and repair progress of a reported road defect in Borongan City.",
      },
      { property: "og:title", content: "Report Details | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Verification, scheduling and repair progress of a reported road defect.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth>
      <ReportDetail />
    </RequireAuth>
  ),
});

function ReportDetail() {
  const { reportId } = useParams({ from: "/reports/$reportId" });

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["report-updates", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_updates")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Loading report…</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">Report not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This report does not exist or you do not have access to it.
          </p>
          <Button asChild className="mt-6">
            <Link to="/reports">Back to my reports</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = WORKFLOW.indexOf(report.status as ReportStatus);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to my reports
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{report.reference_code}</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{report.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {report.road_name}, Brgy. {report.barangay}
            </p>
          </div>
          <div className="flex gap-2">
            <SeverityBadge severity={report.severity_level as SeverityLevel} />
            <StatusBadge status={report.status as ReportStatus} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="glass-card overflow-hidden rounded-2xl">
              <ReportPhoto path={report.photo_url} alt={report.title} className="h-72 w-full" />
              <div className="space-y-3 p-5">
                <h2 className="font-display text-base font-semibold">Damage details</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Damage type</dt>
                    <dd className="text-sm font-medium">{damageLabel(report.damage_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Date reported</dt>
                    <dd className="text-sm font-medium">
                      {new Date(report.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Description</dt>
                    <dd className="text-sm">{report.description || "No description provided."}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">GPS coordinates</dt>
                    <dd className="font-mono text-sm">
                      {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="glass-card overflow-hidden rounded-2xl">
              <h2 className="border-b border-border px-5 py-4 font-display text-base font-semibold">
                Location
              </h2>
              <div className="h-72">
                <ClientMap
                  center={[report.latitude, report.longitude]}
                  zoom={16}
                  markers={[
                    {
                      id: report.id,
                      lat: report.latitude,
                      lng: report.longitude,
                      color: SEVERITY_HEX[report.severity_level as SeverityLevel],
                      content: <span className="text-sm font-medium">{report.title}</span>,
                    },
                  ]}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-base font-semibold">Repair progress</h2>
              <ol className="mt-4 space-y-4">
                {WORKFLOW.map((step, index) => {
                  const done = currentIndex >= index && report.status !== "rejected";
                  return (
                    <li key={step} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}
                      >
                        {statusLabel(step)}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {report.status === "rejected" ? (
                <p className="mt-4 rounded-xl bg-severity-critical/10 p-3 text-sm text-severity-critical">
                  This report was rejected by the City Engineering Office.
                </p>
              ) : null}
            </section>

            <section className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-base font-semibold">Status history</h2>
              <ul className="mt-4 space-y-4">
                {updates.map((update) => (
                  <li key={update.id} className="border-l-2 border-border pl-4">
                    <StatusBadge status={update.status as ReportStatus} />
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5" />
                      {new Date(update.created_at).toLocaleString()}
                    </p>
                    {update.engineer_notes ? (
                      <p className="mt-1 text-sm">{update.engineer_notes}</p>
                    ) : null}
                    {update.repair_date ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Repair date: {new Date(update.repair_date).toLocaleDateString()}
                      </p>
                    ) : null}
                  </li>
                ))}
                {updates.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No updates yet.</li>
                ) : null}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

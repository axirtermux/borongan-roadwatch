import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import { SeverityBadge } from "@/components/badges";
import { UpdateStatusDialog, type AdminReport } from "@/components/admin/UpdateStatusDialog";
import { JobOrderDialog } from "@/components/admin/JobOrderDialog";
import { Button } from "@/components/ui/button";
import { WORKFLOW, damageLabel, statusLabel, type SeverityLevel } from "@/lib/domain";

export const Route = createFileRoute("/admin/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance Board | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Plan, schedule and complete road repair work for verified defects across Borongan City barangays.",
      },
      { property: "og:title", content: "Maintenance Board | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Plan, schedule and complete road repair work for verified defects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <Maintenance />
    </RequireAuth>
  ),
});

const COLUMNS = WORKFLOW.filter((s) => s !== "submitted");

function Maintenance() {
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [jobOrderReport, setJobOrderReport] = useState<AdminReport | null>(null);

  const { data: reports = [] } = useQuery({
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

  return (
    <AdminShell
      title="Maintenance board"
      description="Track verified defects through scheduling, repair work and completion."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const items = reports.filter((report) => report.status === column);
          return (
            <section key={column} className="glass-card rounded-2xl p-3">
              <header className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-sm font-semibold">{statusLabel(column)}</h2>
                <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <div className="space-y-2">
                {items.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelected(report)}
                    className="group relative w-full cursor-pointer rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {report.reference_code}
                      </p>
                      <button
                        type="button"
                        title="Print Official Job Order"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobOrderReport(report);
                        }}
                        className="rounded-lg p-1 text-muted-foreground opacity-70 hover:bg-primary-soft hover:text-primary hover:opacity-100 transition-opacity"
                      >
                        <Printer className="size-3.5" />
                      </button>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium">{report.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {report.road_name}, {report.barangay}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <SeverityBadge severity={report.severity_level as SeverityLevel} />
                      <span className="text-[11px] text-muted-foreground">
                        {damageLabel(report.damage_type)}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <div className="glass-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">
          Select any card to record engineer notes, set a repair date, or print an official City Engineering Job Order slip.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSelected(reports.find((r) => r.status === "submitted") ?? null)}
            disabled={!reports.some((r) => r.status === "submitted")}
          >
            Review oldest new report
          </Button>
        </div>
      </div>

      <UpdateStatusDialog
        report={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />

      <JobOrderDialog
        report={jobOrderReport}
        open={Boolean(jobOrderReport)}
        onOpenChange={(open) => !open && setJobOrderReport(null)}
      />
    </AdminShell>
  );
}

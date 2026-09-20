import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, Search, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { UpdateStatusDialog, type AdminReport } from "@/components/admin/UpdateStatusDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BARANGAYS,
  SEVERITIES,
  STATUSES,
  damageLabel,
  type ReportStatus,
  type SeverityLevel,
} from "@/lib/domain";
import { classifyRoadDamage } from "@/lib/damageClassifier";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Report Management & Systematic Review | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Systematic engineering review, automated classification scoring, and status workflow updates for reported road defects in Borongan City.",
      },
      { property: "og:title", content: "Report Management & Systematic Review" },
      {
        property: "og:description",
        content: "Verify and update road damage reports from residents.",
      },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <AdminReports />
    </RequireAuth>
  ),
});

function AdminReports() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [barangay, setBarangay] = useState("all");
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [reviewOnly, setReviewOnly] = useState(false);

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

  const processedReports = useMemo(() => {
    return reports.map((r) => {
      const auto = classifyRoadDamage({
        damageType: r.damage_type,
        roadName: r.road_name,
        barangay: r.barangay,
        title: r.title,
        description: r.description,
      });
      return {
        ...r,
        computedScore: r.severity_score || auto.score,
        computedSeverity: auto.severityLevel,
        autoRationale: auto.rationale,
      };
    });
  }, [reports]);

  const filtered = processedReports.filter((report) => {
    const term = search.trim().toLowerCase();
    const matchesReviewOnly = !reviewOnly || ["submitted", "under_review"].includes(report.status);

    return (
      matchesReviewOnly &&
      (status === "all" || report.status === status) &&
      (severity === "all" || report.severity_level === severity) &&
      (barangay === "all" || report.barangay === barangay) &&
      (!term ||
        report.reference_code.toLowerCase().includes(term) ||
        report.road_name.toLowerCase().includes(term) ||
        report.barangay.toLowerCase().includes(term) ||
        report.title.toLowerCase().includes(term))
    );
  });

  const exportCsv = () => {
    let csv = "Reference,Title,Road Name,Barangay,Damage Type,Severity,Score,Status,Created At\n";
    filtered.forEach((r) => {
      csv += `"${r.reference_code}","${r.title.replace(/"/g, '""')}","${r.road_name}","${r.barangay}","${r.damage_type}","${r.severity_level}",${r.computedScore},"${r.status}","${r.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Borongan_Road_Reports_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingReviewCount = reports.filter((r) =>
    ["submitted", "under_review"].includes(r.status),
  ).length;

  return (
    <AdminShell
      title="Report Management & Systematic Review"
      description="Systematic evaluation of incoming road defect reports with automated classification and repair workflow progression (Objective 3)."
    >
      {/* Quick filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!reviewOnly ? "default" : "outline"}
            onClick={() => setReviewOnly(false)}
          >
            All Reports ({reports.length})
          </Button>
          <Button
            size="sm"
            variant={reviewOnly ? "default" : "outline"}
            onClick={() => setReviewOnly(true)}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Needs Systematic Review ({pendingReviewCount})
          </Button>
        </div>

        <Button size="sm" variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, road, title or barangay"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
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
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={barangay} onValueChange={setBarangay}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Barangay" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All barangays</SelectItem>
            {BARANGAYS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="glass-card mt-5 overflow-x-auto rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Hazard Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Priority Score</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Workflow Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-mono text-xs">
                  <Link
                    to="/reports/$reportId"
                    params={{ reportId: report.id }}
                    className="text-primary font-bold hover:underline"
                  >
                    {report.reference_code}
                  </Link>
                </TableCell>
                <TableCell className="max-w-44 truncate">{report.title}</TableCell>
                <TableCell className="max-w-44 truncate">
                  {report.road_name}, Brgy. {report.barangay}
                </TableCell>
                <TableCell>{damageLabel(report.damage_type)}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      report.computedScore >= 80
                        ? "bg-destructive/15 text-destructive"
                        : report.computedScore >= 60
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-emerald-500/15 text-emerald-600"
                    }`}
                  >
                    {report.computedScore}/100
                  </span>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={report.severity_level as SeverityLevel} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={report.status as ReportStatus} />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(report)}>
                    Update Task
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No reports match these systematic review filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      <UpdateStatusDialog
        report={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </AdminShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Clock,
  Download,
  FileCheck2,
  Plus,
  Smartphone,
  UserRound,
  Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { DownloadApkModal } from "@/components/DownloadApkModal";
import { SeverityBadge, StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { damageLabel, type ReportStatus, type SeverityLevel } from "@/lib/domain";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Track your submitted road damage reports, pending verifications and completed repairs in Borongan City.",
      },
      { property: "og:title", content: "My Dashboard | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Your road damage reports and their repair status.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <CitizenDashboard />
    </RequireAuth>
  ),
});

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone?: "primary" | "medium" | "low" | "high";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    medium: "bg-severity-medium/20 text-severity-medium-foreground",
    low: "bg-severity-low/15 text-severity-low",
    high: "bg-severity-high/15 text-severity-high",
  };
  return (
    <div className="glass-card rounded-2xl p-5">
      <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function CitizenDashboard() {
  const { user } = useAuth();

  const { data: reports = [] } = useQuery({
    queryKey: ["my-reports", user?.id],
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

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const pending = reports.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const verified = reports.filter((r) =>
    ["verified", "scheduled", "in_progress"].includes(r.status),
  ).length;
  const completed = reports.filter((r) => r.status === "completed").length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your road damage reports and their current repair status.
            </p>
          </div>
          <Button asChild>
            <Link to="/report/new">
              <Plus className="size-4" /> Submit New Report
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="Total submitted reports" value={reports.length} />
          <StatCard icon={Clock} label="Pending reports" value={pending} tone="medium" />
          <StatCard icon={FileCheck2} label="Verified reports" value={verified} tone="high" />
          <StatCard icon={Wrench} label="Completed repairs" value={completed} tone="low" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="glass-card rounded-2xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-base font-semibold">Recent reports</h2>
              <Link to="/reports" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </header>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Damage type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.slice(0, 6).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Link
                          to="/reports/$reportId"
                          params={{ reportId: report.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {report.reference_code}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{damageLabel(report.damage_type)}</TableCell>
                      <TableCell>
                        <SeverityBadge severity={report.severity_level as SeverityLevel} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status as ReportStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        No reports yet. Submit your first road damage report.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="glass-card h-fit rounded-2xl p-5">
            <h2 className="font-display text-base font-semibold">Quick actions</h2>
            <div className="mt-4 grid gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/report/new">
                  <Plus className="size-4" /> Submit new report
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/reports">
                  <ClipboardList className="size-4" /> View my reports
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/profile">
                  <UserRound className="size-4" /> Profile
                </Link>
              </Button>
              <DownloadApkModal
                trigger={
                  <Button variant="outline" className="justify-start border-primary/30 text-primary hover:bg-primary-soft">
                    <Smartphone className="size-4" /> Install Android App (APK)
                  </Button>
                }
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

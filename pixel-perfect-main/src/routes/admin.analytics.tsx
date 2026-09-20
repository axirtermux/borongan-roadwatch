import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import {
  DAMAGE_TYPES,
  SEVERITIES,
  SEVERITY_HEX,
  damageLabel,
  statusLabel,
  type SeverityLevel,
} from "@/lib/domain";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Road Analytics | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Damage trends, severity mix and barangay hotspots derived from citizen road reports in Borongan City.",
      },
      { property: "og:title", content: "Road Analytics | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Damage trends, severity mix and barangay hotspots from citizen reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <Analytics />
    </RequireAuth>
  ),
});

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-4 h-64">{children}</div>
    </section>
  );
}

function Analytics() {
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

  const byType = DAMAGE_TYPES.map((type) => ({
    name: damageLabel(type.value),
    count: reports.filter((r) => r.damage_type === type.value).length,
  }));

  const bySeverity = SEVERITIES.map((s) => ({
    name: s.label,
    value: reports.filter((r) => r.severity_level === s.value).length,
    color: SEVERITY_HEX[s.value as SeverityLevel],
  })).filter((s) => s.value > 0);

  const barangayCounts = Object.entries(
    reports.reduce<Record<string, number>>((acc, report) => {
      acc[report.barangay] = (acc[report.barangay] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - i));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      key,
      name: date.toLocaleString(undefined, { month: "short" }),
      reports: 0,
      completed: 0,
    };
  });

  reports.forEach((report) => {
    const date = new Date(report.created_at);
    const bucket = months.find((m) => m.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) {
      bucket.reports += 1;
      if (report.status === "completed") bucket.completed += 1;
    }
  });

  const completed = reports.filter((r) => r.status === "completed").length;
  const resolutionRate = reports.length ? Math.round((completed / reports.length) * 100) : 0;

  return (
    <AdminShell
      title="Analytics"
      description="Damage patterns and repair performance across Borongan City."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-3xl font-bold">{reports.length}</p>
          <p className="text-sm text-muted-foreground">Total reports received</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-3xl font-bold">{completed}</p>
          <p className="text-sm text-muted-foreground">Repairs completed</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="font-display text-3xl font-bold">{resolutionRate}%</p>
          <p className="text-sm text-muted-foreground">Resolution rate</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Reports over the last 6 months">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={months}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="reports" stroke="#1d4ed8" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="#1f9d55" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Severity distribution">
          {bySeverity.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySeverity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  isAnimationActive={false}
                  label={(entry: { name: string; value: number }) =>
                    `${entry.name}: ${entry.value}`
                  }
                >

                  {bySeverity.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </Panel>

        <Panel title="Damage types">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Barangay hotspots">
          {barangayCounts.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barangayCounts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={110} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef7411" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </Panel>
      </div>

      <section className="glass-card mt-5 rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold">Workflow breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {["submitted", "under_review", "verified", "scheduled", "in_progress", "completed", "rejected"].map(
            (status) => (
              <div key={status} className="rounded-xl border border-border p-4">
                <p className="font-display text-2xl font-bold">
                  {reports.filter((r) => r.status === status).length}
                </p>
                <p className="text-xs text-muted-foreground">{statusLabel(status)}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </AdminShell>
  );
}

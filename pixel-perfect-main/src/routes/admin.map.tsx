import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import { ClientMap } from "@/components/map/ClientMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BARANGAYS,
  BORONGAN_CENTER,
  DAMAGE_TYPES,
  SEVERITIES,
  SEVERITY_HEX,
  STATUSES,
  damageLabel,
  statusLabel,
  type DamageType,
  type SeverityLevel,
} from "@/lib/domain";

export const Route = createFileRoute("/admin/map")({
  head: () => ({
    meta: [
      { title: "GIS Damage Map | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Geographic view of every reported road defect in Borongan City, colour-coded by severity for repair planning.",
      },
      { property: "og:title", content: "GIS Damage Map | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Geographic view of reported road defects, colour-coded by severity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <AdminMap />
    </RequireAuth>
  ),
});

function AdminMap() {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [damageType, setDamageType] = useState("all");
  const [barangay, setBarangay] = useState("all");

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

  const filtered = reports.filter(
    (report) =>
      (severity === "all" || report.severity_level === severity) &&
      (status === "all" || report.status === status) &&
      (damageType === "all" || report.damage_type === damageType) &&
      (barangay === "all" || report.barangay === barangay),
  );

  return (
    <AdminShell
      title="GIS Damage & Maintenance Map"
      description="Interactive spatial visualization of routine road defects across Borongan City (Objective 2 & Scope 5)."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={damageType} onValueChange={setDamageType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Damage Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Damage Types</SelectItem>
            {DAMAGE_TYPES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={barangay} onValueChange={setBarangay}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Barangay" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All Barangays</SelectItem>
            {BARANGAYS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          {SEVERITIES.map((s) => (
            <span key={s.value} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: SEVERITY_HEX[s.value] }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card mt-5 h-[540px] overflow-hidden rounded-2xl border border-border relative">
        <ClientMap
          center={BORONGAN_CENTER}
          zoom={13}
          markers={filtered.map((report) => ({
            id: report.id,
            lat: report.latitude,
            lng: report.longitude,
            color: SEVERITY_HEX[report.severity_level as SeverityLevel],
            content: (
              <div className="space-y-1.5 p-1">
                <p className="font-bold text-sm leading-tight">{report.title}</p>
                <p className="text-xs text-muted-foreground">
                  {report.road_name}, Brgy. {report.barangay}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{damageLabel(report.damage_type)}</span>
                  <span>·</span>
                  <span className="capitalize">{statusLabel(report.status)}</span>
                </div>
                <div className="pt-1 flex items-center justify-between border-t border-border mt-1">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {report.reference_code}
                  </span>
                  <Link
                    to="/reports/$reportId"
                    params={{ reportId: report.id }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Review Details →
                  </Link>
                </div>
              </div>
            ),
          }))}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          Displaying <strong>{filtered.length}</strong> of <strong>{reports.length}</strong> reported
          defects in Borongan City.
        </p>
        <p>
          Coordinates verified within Eastern Samar provincial jurisdiction (11.40°N–11.85°N,
          125.25°E–125.55°E).
        </p>
      </div>
    </AdminShell>
  );
}

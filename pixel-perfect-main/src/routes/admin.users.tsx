import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/RequireAuth";
import { AdminShell } from "@/components/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Registered Users | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Directory of Borongan City residents and engineering staff registered on the road reporting system.",
      },
      { property: "og:title", content: "Registered Users | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Directory of residents and engineering staff on the reporting system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireAuth engineerOnly>
      <AdminUsers />
    </RequireAuth>
  ),
});

function AdminUsers() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("id, user_id");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminShell
      title="Registered users"
      description="Residents and City Engineering Office staff using Borongan RoadWatch."
    >
      <section className="glass-card overflow-x-auto rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Account type</TableHead>
              <TableHead>Reports filed</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const isEngineer = roles.some(
                (role) => role.user_id === profile.id && role.role === "engineer",
              );
              const count = reports.filter((r) => r.user_id === profile.id).length;
              return (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                  <TableCell className="text-muted-foreground">{profile.phone || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        isEngineer
                          ? "border-primary/25 bg-primary-soft text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {isEngineer ? "Engineering staff" : "Citizen"}
                    </span>
                  </TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No registered users yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
      <p className="mt-3 text-sm text-muted-foreground">
        Engineering accounts are granted by the system administrator for security reasons.
      </p>
    </AdminShell>
  );
}

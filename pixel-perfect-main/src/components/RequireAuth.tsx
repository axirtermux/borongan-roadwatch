import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({
  children,
  engineerOnly = false,
}: {
  children: ReactNode;
  engineerOnly?: boolean;
}) {
  const { session, loading, isEngineer, roleLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { mode: "login" } });
    }
  }, [loading, session, navigate]);

  if (loading || !session || (engineerOnly && !roleLoaded)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (engineerOnly && !isEngineer) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-severity-critical" />
          <h1 className="mt-4 text-lg font-semibold">Restricted area</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The engineering dashboard is limited to authorized City Engineering Office personnel.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "login" | "register";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search['mode'] === "register" ? "register" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Sign in | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Login or register to report road damage in Borongan City and track the progress of your reports.",
      },
      { property: "og:title", content: "Sign in | Borongan RoadWatch" },
      {
        property: "og:description",
        content: "Access your Borongan RoadWatch citizen account or engineering dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [tab, setTab] = useState<Mode>(mode);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) {
      if (
        error.message.toLowerCase().includes("email not confirmed") ||
        error.message.toLowerCase().includes("invalid login credentials")
      ) {
        toast.error(
          "Login failed. If you recently registered, your Supabase project requires email confirmation first. Please verify the link in your email, or turn off 'Confirm Email' in Supabase Auth Settings.",
          { duration: 8000 }
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back.");
    navigate({ to: "/dashboard" });
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: String(form.get("full_name")),
          phone: String(form.get("phone")),
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created and signed in!");
      navigate({ to: "/dashboard" });
    } else {
      toast.info(
        "Account created! Please check your email inbox to confirm your address before signing in (or disable 'Confirm email' in Supabase Auth Settings to allow instant sign-ins).",
        { duration: 9000 }
      );
      setTab("login");
    }
  };

  const handleReset = async (email: string) => {
    if (!email) {
      toast.error("Enter your email address first, then tap Forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=login`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="civic-gradient relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <MapPinned className="size-5" />
          </span>
          <span className="font-display font-semibold">Borongan RoadWatch</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl leading-tight font-bold">
            Report a damaged road in under a minute.
          </h1>
          <p className="mt-4 max-w-md opacity-90">
            Your account keeps a record of every report you file and notifies you as the City
            Engineering Office verifies, schedules and completes the repair.
          </p>
        </div>
        <p className="text-sm opacity-75">City Government of Borongan · Eastern Samar</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="font-display text-lg font-semibold">
              Borongan RoadWatch
            </Link>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="glass-card mt-6 space-y-4 rounded-2xl p-6">
                <div>
                  <h2 className="font-display text-xl font-semibold">Login</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Access your reports and notifications.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} Login
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => {
                    const input = document.getElementById("login-email") as HTMLInputElement | null;
                    handleReset(input?.value ?? "");
                  }}
                >
                  Forgot password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="glass-card mt-6 space-y-4 rounded-2xl p-6">
                <div>
                  <h2 className="font-display text-xl font-semibold">Create a citizen account</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Residents of Borongan City can register for free.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="09XX XXX XXXX" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null} Register
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

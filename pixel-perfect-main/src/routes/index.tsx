import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  Mail,
  MapPin,
  Phone,
  Satellite,
  ShieldCheck,
  Siren,
  Smartphone,
  Sparkles,
} from "lucide-react";
import heroRoad from "@/assets/hero-road.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { DownloadApkModal } from "@/components/DownloadApkModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Borongan RoadWatch | Report Road Damage in Borongan City" },
      {
        name: "description",
        content:
          "Report potholes and road damage in Borongan City using GPS and photos. The City Engineering Office verifies, prioritizes and tracks every repair.",
      },
      { property: "og:title", content: "Borongan RoadWatch | Report Road Damage" },
      {
        property: "og:description",
        content:
          "GPS-based road damage reporting and maintenance monitoring for the City of Borongan, Eastern Samar.",
      },
    ],
  }),
  component: Landing,
});

const steps = [
  {
    icon: Camera,
    title: "Capture the damage",
    text: "Take a photo of the pothole, crack or eroded surface directly from your phone.",
  },
  {
    icon: Satellite,
    title: "GPS pins the location",
    text: "Coordinates, date and time are captured automatically and shown on an interactive map.",
  },
  {
    icon: ShieldCheck,
    title: "Engineers verify",
    text: "The City Engineering Office reviews the report and assigns a severity level.",
  },
  {
    icon: CheckCircle2,
    title: "Track until repaired",
    text: "Follow every status change from verification to completed repair, with notifications.",
  },
];

const features = [
  {
    icon: MapPin,
    title: "Interactive GIS map",
    text: "All reports plotted on OpenStreetMap with color-coded severity markers and filters.",
  },
  {
    icon: ClipboardList,
    title: "Maintenance workflow",
    text: "Submitted, under review, verified, scheduled, in progress and completed — every step timestamped.",
  },
  {
    icon: Siren,
    title: "Severity prioritization",
    text: "Low, medium, high and critical classifications so crews handle the worst roads first.",
  },
  {
    icon: BarChart3,
    title: "Analytics for planning",
    text: "Damage trends, most affected barangays and repair performance in one dashboard.",
  },
];

function Landing() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <img
            src={heroRoad}
            alt="Coastal highway in Borongan City with visible road damage"
            width={1600}
            height={1008}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#002776]/95 via-[#0038A8]/90 to-[#0b1c3e]/85" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="max-w-3xl text-primary-foreground">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300 uppercase">
                  <img src="/dpwh-logo.png" alt="DPWH Logo" className="size-4.5 shrink-0 object-contain" />
                  DPWH · City Engineering Office of Borongan
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  Eastern Samar, Philippines
                </span>
              </div>
              <h1 className="mt-6 font-display text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
                GPS-Based Road Damage Reporting & Maintenance System
              </h1>
              <p className="mt-5 text-base/relaxed text-slate-100 opacity-95 sm:text-lg/relaxed max-w-2xl">
                An integrated civic infrastructure platform enabling citizens to report road hazards
                with real-time GPS coordinates and photos, empowering engineers with a live GIS dashboard
                to prioritize, verify, and monitor repairs across Borongan City.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-[#FF8200] hover:bg-[#ffa034] text-slate-950 font-bold shadow-lg shadow-amber-900/30"
                  asChild
                >
                  {session ? (
                    <Link to="/report/new">
                      Submit a Report <ArrowRight className="size-4 ml-1" />
                    </Link>
                  ) : (
                    <Link to="/auth" search={{ mode: "register" }}>
                      Submit a Report <ArrowRight className="size-4 ml-1" />
                    </Link>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
                  asChild
                >
                  {session ? (
                    <Link to="/dashboard">Go to Dashboard</Link>
                  ) : (
                    <Link to="/auth" search={{ mode: "login" }}>
                      Login
                    </Link>
                  )}
                </Button>
                <DownloadApkModal
                  trigger={
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-amber-400/50 bg-amber-500/20 text-white hover:bg-amber-500/30 gap-2 font-medium"
                    >
                      <Smartphone className="size-4 text-amber-300" /> Download Android APK
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">About the system</h2>
              <p className="mt-4 text-muted-foreground">
                Road defects in Borongan are often reported through informal channels, making them
                hard to locate and slow to act on. This system replaces that with geotagged,
                photo-verified reports stored in a single municipal record.
              </p>
              <p className="mt-4 text-muted-foreground">
                Every submission carries exact coordinates, the barangay, the damage classification
                and a timestamped history — giving engineering personnel the evidence they need to
                schedule maintenance and justify budgets.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { k: "Geotagged", v: "Every report carries GPS coordinates" },
                { k: "Photo-verified", v: "Photo evidence required before submission" },
                { k: "6 stages", v: "From submitted to completed repair" },
                { k: "4 levels", v: "Severity-based repair prioritization" },
              ].map((item) => (
                <div key={item.k} className="glass-card rounded-xl p-5">
                  <dt className="font-display text-lg font-semibold text-primary">{item.k}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section className="surface-grid border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="font-display text-3xl font-bold">How it works</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Four steps from a pothole on your street to a recorded municipal repair.
            </p>
            <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="glass-card rounded-2xl p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <step.icon className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold">Features</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card flex gap-4 rounded-2xl p-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl civic-gradient text-primary-foreground">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scope and Limitations */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold">Scope & System Limitations</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-semibold text-sm text-primary">Solely for Borongan City</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Geographic scope is verified via GPS coordinates strictly within the municipal boundaries
                of Borongan City, Eastern Samar (Limitation 7).
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-semibold text-sm text-primary">Routine Surface Defects Only</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Exclusively tracks routine surface defects (potholes, cracks, erosion, subsidence). Major
                bridge failures and non-road municipal works are excluded (Limitation 1).
              </p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-semibold text-sm text-primary">Manual Crew Dispatch</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                While the system automates classification and severity assignment, physical crew
                deployment and heavy equipment mobilization are executed manually by city engineers (Limitation 5).
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="civic-gradient rounded-3xl px-8 py-14 text-center text-primary-foreground shadow-xl">
            <h2 className="font-display text-3xl font-bold">Seen a damaged road today?</h2>
            <p className="mx-auto mt-3 max-w-xl opacity-90">
              It takes under a minute. Your report goes straight to the City Engineering Office
              with its exact location and GPS coordinates.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-[#FF8200] hover:bg-[#ffa034] text-slate-950 font-bold shadow-md"
                asChild
              >
                {session ? (
                  <Link to="/report/new">
                    Report Road Damage <ArrowRight className="size-4 ml-1" />
                  </Link>
                ) : (
                  <Link to="/auth" search={{ mode: "register" }}>
                    Report Road Damage <ArrowRight className="size-4 ml-1" />
                  </Link>
                )}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Contact / footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img
                src="/dpwh-logo.png"
                alt="DPWH Official Seal"
                className="size-11 object-contain drop-shadow-xs"
              />
              <div>
                <h3 className="font-display text-base font-semibold">City Engineering Office</h3>
                <p className="text-xs text-muted-foreground">In coordination with DPWH Eastern Samar</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              City Hall Compound, Borongan City, Eastern Samar, Philippines 6800
            </p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Phone className="size-4 text-primary" /> (055) 261-2000
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-primary" /> roadwatch@borongan.gov.ph
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Mon–Fri, 8:00 AM – 5:00 PM
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              Coverage is limited to routine road surface defects within Borongan City. Bridge
              failures and non-road infrastructure are handled by separate offices.
            </p>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} City Government of Borongan · Road Damage Reporting and
          Maintenance System
        </div>
      </footer>
    </div>
  );
}

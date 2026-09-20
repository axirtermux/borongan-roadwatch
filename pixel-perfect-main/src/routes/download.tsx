import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Download,
  HelpCircle,
  MapPin,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download Mobile App (APK) | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Download the official Borongan RoadWatch native Android APK application to report road defects and track repairs on your phone.",
      },
      { property: "og:title", content: "Download Borongan RoadWatch APK" },
      {
        property: "og:description",
        content: "Direct Android APK download for everyday citizens of Borongan City.",
      },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" /> Back to Home
        </Link>

        {/* Hero Card with QR Code */}
        <section className="civic-gradient rounded-3xl p-8 sm:p-12 text-primary-foreground relative overflow-hidden shadow-xl">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                <Smartphone className="size-3.5" /> Official Android Application
              </span>
              <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-5xl">
                Borongan RoadWatch for Android
              </h1>
              <p className="mt-4 text-base opacity-90 leading-relaxed sm:text-lg">
                Report potholes, road cracks, and pavement subsidence on-the-go with real-time GPS
                geotagging and photographic proof. Receive live notifications as the City Engineering
                Office verifies and repairs your reported roads.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2.5 text-base font-bold shadow-lg text-primary"
                  asChild
                >
                  <a href="/downloads/borongan-roadwatch.apk" download="borongan-roadwatch.apk">
                    <Download className="size-5" /> Download Android APK (Direct)
                  </a>
                </Button>
                <span className="text-xs text-white/80">Version 1.0.0 · Free for Citizens</span>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <QRCodeDisplay className="bg-card/95 text-foreground backdrop-blur shadow-2xl max-w-sm w-full border-white/20" />
            </div>
          </div>
        </section>

        {/* Metadata & Quick Specs */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Package ID</p>
            <p className="mt-1 font-mono text-sm font-bold text-primary truncate">
              gov.ph.borongan.roadwatch
            </p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Compatibility</p>
            <p className="mt-1 text-sm font-bold text-foreground">Android 8.0 (Oreo) or newer</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Hardware Sensors</p>
            <p className="mt-1 text-sm font-bold text-foreground">GPS Sensor & Camera</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Jurisdiction</p>
            <p className="mt-1 text-sm font-bold text-severity-low">Borongan City, Eastern Samar</p>
          </div>
        </section>

        {/* Step-by-Step Sideloading Instructions */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">How to Install on Your Android Smartphone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Installing an APK directly takes less than a minute. Follow these 4 easy steps:
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Download APK",
                text: "Tap the download button above. Confirm the browser download prompt when it appears.",
                icon: Download,
              },
              {
                step: "2",
                title: "Confirm Security",
                text: "If prompted with 'File might be harmful', tap 'Download anyway'. This is standard for apps outside the Play Store.",
                icon: ShieldCheck,
              },
              {
                step: "3",
                title: "Allow Installation",
                text: "Open the downloaded .apk file. In Android Settings, toggle 'Allow from this source' for your browser.",
                icon: Smartphone,
              },
              {
                step: "4",
                title: "Launch & Report",
                text: "Tap 'Install' and launch Borongan RoadWatch. Grant GPS location and camera permissions when prompted.",
                icon: CheckCircle2,
              },
            ].map((item) => (
              <div key={item.step} className="glass-card rounded-2xl p-6 relative">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold">
                  <item.icon className="size-5" />
                </span>
                <span className="absolute top-6 right-6 font-display text-3xl font-extrabold text-muted/40">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{item.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* App Features Grid */}
        <section className="mt-12 glass-card rounded-3xl p-8 border border-border">
          <h2 className="font-display text-xl font-bold">Key Mobile Features (Scope 1–5)</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3 text-sm">
            <div className="space-y-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Camera className="size-4" />
              </span>
              <h3 className="font-semibold text-foreground">Real-Time Photo Capture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Take photo evidence directly using smartphone camera hardware to document potholes,
                cracks, and road depressions.
              </p>
            </div>
            <div className="space-y-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MapPin className="size-4" />
              </span>
              <h3 className="font-semibold text-foreground">GPS Sensor Geotagging</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically extracts precise latitude and longitude coordinates with sensor accuracy
                verification within Borongan City limits.
              </p>
            </div>
            <div className="space-y-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="size-4" />
              </span>
              <h3 className="font-semibold text-foreground">Automated Severity Rating</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculates a composite severity score (0–100) instantly based on damage type, road
                arterial weight, and reported hazard dimensions.
              </p>
            </div>
          </div>
        </section>

        {/* Scope & Limitations Disclaimer */}
        <section className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft/30 p-5 text-xs text-muted-foreground leading-relaxed">
          <h3 className="font-semibold text-primary mb-1">Administrative Scope Reminder:</h3>
          This native mobile reporting tool is exclusively intended for routine road surface defects
          within the territorial jurisdiction of Borongan City (Limitation 1 & 7). Structural bridge
          failures or non-road municipal works are handled by DPWH Eastern Samar or Borongan CDRRMO.
        </section>
      </main>
    </div>
  );
}

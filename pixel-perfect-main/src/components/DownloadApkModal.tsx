import { useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Download,
  MapPin,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

export function DownloadApkModal({
  trigger,
  defaultOpen = false,
}: {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Smartphone className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg">Get Borongan RoadWatch App</DialogTitle>
              <DialogDescription>
                Native cross-platform Android application for citizens of Borongan City.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* App Metadata Card */}
          <div className="rounded-2xl border border-border bg-secondary/30 p-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px]">Version:</span>
                <p className="font-semibold text-foreground">v1.0.0 Release</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Target OS:</span>
                <p className="font-semibold text-foreground">Android 8.0+</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Package ID:</span>
                <p className="font-mono text-foreground text-[11px] truncate">gov.ph.borongan.roadwatch</p>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Sensors:</span>
                <p className="font-semibold text-foreground">GPS & Camera</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct" className="gap-2">
                <Download className="size-3.5" /> Direct Download
              </TabsTrigger>
              <TabsTrigger value="qr" className="gap-2">
                <QrCode className="size-3.5" /> Scan QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="space-y-4 pt-3">
              {/* Primary Download Button */}
              <div className="space-y-2">
                <Button size="lg" className="w-full gap-2 text-base font-bold shadow-md" asChild>
                  <a href="/downloads/borongan-roadwatch.apk" download="borongan-roadwatch.apk">
                    <Download className="size-5" /> Download Android APK (Direct)
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="w-full gap-2 text-xs" asChild>
                  <a
                    href="https://github.com/axirtermux/borongan-roadwatch/releases/download/v1.0.0/borongan-roadwatch.apk"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="size-3.5" /> Fast CDN Mirror (GitHub Releases)
                  </a>
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Direct download hosted securely by the City Government of Borongan & GitHub CDN.
                </p>
              </div>

              {/* Sideloading / Installation Steps */}
              <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <h4 className="font-display text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Installation Instructions on Android:
                </h4>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      1
                    </span>
                    <span>
                      Tap <strong>Download Android APK</strong> above and confirm the browser download prompt.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      2
                    </span>
                    <span>
                      If prompted with <em>"File might be harmful"</em>, tap <strong>Download anyway</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      3
                    </span>
                    <span>
                      Open the downloaded file. In Android Settings, toggle <strong>Allow from this source</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      4
                    </span>
                    <span>
                      Tap <strong>Install</strong>, launch the app, and allow <strong>Location (GPS)</strong> & <strong>Camera</strong> permissions.
                    </span>
                  </li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="pt-2">
              <QRCodeDisplay />
            </TabsContent>
          </Tabs>

          {/* Scope Reminder */}
          <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Borongan Jurisdiction Notice:</strong> The mobile app uses smartphone GPS hardware to verify that all submitted road hazard reports are located within the municipal boundary of Borongan City.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

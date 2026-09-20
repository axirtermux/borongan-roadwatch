import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, ExternalLink, QrCode as QrCodeIcon, Smartphone, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QRCodeDisplayProps {
  initialUrl?: string;
  className?: string;
}

export function QRCodeDisplay({ initialUrl, className = "" }: QRCodeDisplayProps) {
  const [downloadUrl, setDownloadUrl] = useState(initialUrl || "");
  const [qrSvg, setQrSvg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [customIpMode, setCustomIpMode] = useState(false);
  const [customHost, setCustomHost] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultUrl = initialUrl || `${window.location.origin}/downloads/borongan-roadwatch.apk`;
      setDownloadUrl(defaultUrl);
      setCustomHost(window.location.hostname);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (!downloadUrl) return;

    QRCode.toString(downloadUrl, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#1e3a8a",
        light: "#ffffff",
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("Failed to generate QR code", err));
  }, [downloadUrl]);

  const handleCopy = () => {
    if (!downloadUrl) return;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyCustomHost = (host: string) => {
    setCustomHost(host);
    if (typeof window !== "undefined") {
      const port = window.location.port ? `:${window.location.port}` : "";
      const protocol = window.location.protocol;
      setDownloadUrl(`${protocol}//${host}${port}/downloads/borongan-roadwatch.apk`);
    }
  };

  return (
    <div className={`glass-card rounded-2xl p-6 border border-border flex flex-col items-center text-center ${className}`}>
      <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
        <QrCodeIcon className="size-4" />
        <span>Instant Scan & Install</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Point your Android camera at this QR code to download the APK directly to your phone.
      </p>

      {/* QR Code Container */}
      <div className="relative rounded-2xl bg-white p-3 shadow-md border border-border/80 flex items-center justify-center">
        {qrSvg ? (
          <div
            className="size-44 sm:size-48 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        ) : (
          <div className="size-44 sm:size-48 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Generating QR Code…
          </div>
        )}
      </div>

      {/* URL Display and Copy */}
      <div className="mt-4 w-full max-w-sm flex items-center gap-2 rounded-xl bg-muted/60 p-1.5 border border-border">
        <span className="text-[11px] font-mono text-muted-foreground truncate px-2 flex-1 text-left">
          {downloadUrl || "/downloads/borongan-roadwatch.apk"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2.5 text-xs gap-1"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3 text-green-600" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {/* LAN Wi-Fi Pairing Helper for Defense/Testing */}
      <div className="mt-4 pt-3 border-t border-border/60 w-full text-xs">
        <button
          type="button"
          onClick={() => setCustomIpMode(!customIpMode)}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <Wifi className="size-3" />
          {customIpMode ? "Hide LAN IP settings" : "Testing on local Wi-Fi? Click here"}
        </button>

        {customIpMode && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-muted/40 border border-border text-left space-y-2">
            <p className="text-[11px] text-muted-foreground">
              If testing on a smartphone connected to the same Wi-Fi, enter your laptop's Local IP (e.g. 192.168.1.15):
            </p>
            <div className="flex gap-2">
              <Input
                size={1}
                className="h-8 text-xs font-mono"
                value={customHost}
                onChange={(e) => applyCustomHost(e.target.value)}
                placeholder="192.168.1.xxx"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                onClick={() => applyCustomHost(customHost)}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Crosshair,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { ClientMap } from "@/components/map/ClientMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SEVERITY_HEX,
  type DamageType,
} from "@/lib/domain";
import {
  classifyRoadDamage,
  isWithinBoronganCity,
  BORONGAN_BOUNDS,
} from "@/lib/damageClassifier";

export const Route = createFileRoute("/report/new")({
  head: () => ({
    meta: [
      { title: "Submit Road Damage Report | Borongan RoadWatch" },
      {
        name: "description",
        content:
          "Report routine road defects in Borongan City with GPS coordinates, photographic evidence, and automated severity evaluation.",
      },
      { property: "og:title", content: "Submit Road Damage Report" },
      {
        property: "og:description",
        content:
          "Send a geotagged, photo-verified road damage report to the City Engineering Office.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SubmitReport />
    </RequireAuth>
  ),
});

function SubmitReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coords, setCoords] = useState<[number, number]>(BORONGAN_CENTER);
  const [locating, setLocating] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roadName, setRoadName] = useState("");
  const [damageType, setDamageType] = useState<DamageType>("pothole");
  const [depthCategory, setDepthCategory] = useState<"shallow" | "medium" | "deep">("medium");
  const [widthCategory, setWidthCategory] = useState<"small" | "moderate" | "large">("moderate");
  const [barangay, setBarangay] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const fileRef = useRef<HTMLInputElement>(null);

  // Monitor network connectivity (Limitation 2 & 6)
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network connection lost. Upload requires an active internet connection.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("This device does not support GPS location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords([lat, lng]);
        setAccuracy(position.coords.accuracy);
        setHasFix(true);
        setLocating(false);
        setNow(new Date());

        if (!isWithinBoronganCity(lat, lng)) {
          toast.warning("Warning: Detected GPS coordinate is outside Borongan City limits.");
        }
      },
      () => {
        setLocating(false);
        toast.error("Location access denied. Tap the map to place the pin manually.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Borongan boundary check (Limitation 7)
  const isBoronganValid = useMemo(() => isWithinBoronganCity(coords[0], coords[1]), [coords]);

  // Automated Data Processing Mechanism (Objective 3 & Scope 4)
  const automatedAssessment = useMemo(() => {
    return classifyRoadDamage({
      damageType,
      roadName: roadName || "Real Street",
      barangay: barangay || "Borongan City",
      title: title || "Road defect",
      description,
      depthCategory,
      widthCategory,
    });
  }, [damageType, roadName, barangay, title, description, depthCategory, widthCategory]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOnline) {
      toast.error("Cannot submit report while offline. Please connect to cellular data or Wi-Fi.");
      return;
    }
    if (!photo) {
      toast.error("A photo of the damage is required.");
      return;
    }
    if (!barangay) {
      toast.error("Select the barangay.");
      return;
    }
    if (!isBoronganValid) {
      toast.error("Coordinates are outside Borongan City jurisdiction. Adjust pin on map.");
      return;
    }

    setSubmitting(true);
    setUploadProgress("Uploading photo evidence to secure server...");

    try {
      const ext = photo.name.split(".").pop() ?? "jpg";
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("damage-photos")
        .upload(path, photo, { contentType: photo.type });

      if (uploadError) {
        throw new Error(
          `Photo upload interrupted: ${uploadError.message}. Per system protocol, please re-submit in a stable session.`,
        );
      }

      setUploadProgress("Categorizing incident & calculating automated severity...");

      const { data, error } = await supabase
        .from("reports")
        .insert({
          user_id: user!.id,
          title: title.trim(),
          description: description.trim(),
          road_name: roadName.trim(),
          barangay,
          damage_type: damageType,
          severity_level: automatedAssessment.severityLevel,
          photo_url: path,
          latitude: coords[0],
          longitude: coords[1],
        })
        .select("id")
        .single();

      if (error) throw error;

      toast.success(
        `Report submitted with ${automatedAssessment.severityLevel.toUpperCase()} severity level (Score: ${automatedAssessment.score}/100).`,
      );
      navigate({ to: "/reports/$reportId", params: { reportId: data.id } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit report within this session.",
      );
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Network & Session Status Notice */}
        {!isOnline ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <WifiOff className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Offline Mode Detected</p>
              <p className="text-xs">
                Data submission and photo uploads require a stable internet connection (Limitation 2).
              </p>
            </div>
          </div>
        ) : null}

        {/* Limitation 1 & 7 Routine Defects Disclaimer */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <Info className="size-4 shrink-0 text-primary mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Municipal Scope Notice: </span>
              This system is exclusively designated to record, map, and track{" "}
              <strong>routine road surface defects solely within Borongan City</strong> (potholes,
              cracks, erosion, subsidence). Major structural bridge failures, landslides, or non-road
              infrastructure must be reported directly to DPWH Eastern Samar or Borongan CDRRMO.
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold sm:text-3xl">Report Road Damage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Geotagged photographic evidence with real-time automated severity evaluation.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Incident Details */}
          <section className="glass-card space-y-4 rounded-2xl p-5">
            <div className="space-y-2">
              <Label htmlFor="title">Hazard title</Label>
              <Input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing motorcycle swerving"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Hazard description & dimensions</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe size, depth, water ponding, visibility at night, or hazard to motorists."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="road_name">Road / Street Name</Label>
                <Input
                  id="road_name"
                  name="road_name"
                  required
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. Real Street, Samar East Coastal Road"
                />
              </div>

              <div className="space-y-2">
                <Label>Barangay (Borongan City)</Label>
                <Select value={barangay} onValueChange={setBarangay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select barangay" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {BARANGAYS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Damage classification parameters */}
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="space-y-2">
                <Label>Damage Type</Label>
                <Select value={damageType} onValueChange={(v) => setDamageType(v as DamageType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Depth</Label>
                <Select
                  value={depthCategory}
                  onValueChange={(v) => setDepthCategory(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shallow">Shallow (&lt; 2 cm)</SelectItem>
                    <SelectItem value="medium">Moderate (2 - 5 cm)</SelectItem>
                    <SelectItem value="deep">Deep (&gt; 5 cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimated Width</Label>
                <Select
                  value={widthCategory}
                  onValueChange={(v) => setWidthCategory(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (&lt; 30 cm)</SelectItem>
                    <SelectItem value="moderate">Medium (30 - 100 cm)</SelectItem>
                    <SelectItem value="large">Large (&gt; 1 meter / lane)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Objective 3: Automated Severity Assessment Live Preview */}
          <section className="rounded-2xl border border-primary/30 bg-primary-soft/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">
                  Automated Severity Classification (Objective 3)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">Score: {automatedAssessment.score}/100</span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase text-white"
                  style={{
                    backgroundColor:
                      SEVERITY_HEX[automatedAssessment.severityLevel] || "#dc2626",
                  }}
                >
                  {automatedAssessment.severityLevel}
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground space-y-1.5">
              <p>
                <strong>Evaluation Rationale:</strong> {automatedAssessment.rationale}
              </p>
              <p>
                <strong>Target Engineering Timeframe:</strong>{" "}
                {automatedAssessment.recommendedTimeframe}
              </p>
            </div>
          </section>

          {/* Photo Evidence */}
          <section className="glass-card space-y-3 rounded-2xl p-5">
            <Label className="flex items-center justify-between">
              <span>Photo evidence (required)</span>
              {photo ? (
                <span className="text-xs font-normal text-severity-low flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Photo verified
                </span>
              ) : null}
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              <img
                src={preview}
                alt="Selected road damage"
                className="h-56 w-full rounded-xl object-cover border border-border"
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full sm:w-auto"
            >
              <Camera className="size-4" /> {photo ? "Change photo" : "Capture or upload photo"}
            </Button>
            {photo ? (
              <p className="text-xs text-muted-foreground">{photo.name}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Submissions without photographic proof cannot be verified by the engineering office.
              </p>
            )}
          </section>

          {/* GPS Location & Borongan Boundaries */}
          <section className="glass-card space-y-3 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Live GPS Sensor Verification (Scope 2)
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
                {locating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crosshair className="size-4" />
                )}
                Acquire Current GPS
              </Button>
            </div>

            {/* Boundary Validation Alert */}
            {!isBoronganValid ? (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                Coordinates ({coords[0].toFixed(4)}, {coords[1].toFixed(4)}) fall outside Borongan
                City. Please tap within Borongan boundaries on the map.
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-severity-low/15 p-2.5 text-xs text-severity-low font-medium">
                <CheckCircle2 className="size-4 shrink-0" />
                Verified within Borongan City road network jurisdiction.
              </div>
            )}

            <div className="h-72 overflow-hidden rounded-xl border border-border">
              <ClientMap
                center={coords}
                zoom={15}
                recenterKey={coords.join(",")}
                markers={[
                  {
                    id: "pin",
                    lat: coords[0],
                    lng: coords[1],
                    color: SEVERITY_HEX[automatedAssessment.severityLevel],
                  },
                ]}
                onPick={(lat, lng) => {
                  setCoords([lat, lng]);
                  setHasFix(true);
                  setAccuracy(null);
                }}
              />
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-muted-foreground">Latitude: </span>
                <span className="font-mono font-medium">{coords[0].toFixed(6)}</span>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-muted-foreground">Longitude: </span>
                <span className="font-mono font-medium">{coords[1].toFixed(6)}</span>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-muted-foreground">Date: </span>
                <span className="font-medium">{now.toLocaleDateString()}</span>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <span className="text-muted-foreground">Time: </span>
                <span className="font-medium">{now.toLocaleTimeString()}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {hasFix
                ? accuracy
                  ? `Smartphone GPS hardware fix acquired (±${Math.round(accuracy)} m accuracy). Tap map to fine-tune.`
                  : "Pin manually placed. Tap map to reposition."
                : "Waiting for smartphone sensor fix — you may tap the map to place pin."}
            </p>
          </section>

          {/* Submission button with progress */}
          <div className="space-y-2">
            <Button
              type="submit"
              size="lg"
              className="w-full text-base font-semibold"
              disabled={submitting || !isBoronganValid || !isOnline}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> {uploadProgress || "Processing submission..."}
                </>
              ) : (
                "Submit Road Damage Report"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By submitting, you certify that this incident is a routine road surface defect in Borongan City.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}

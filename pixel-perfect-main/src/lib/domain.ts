export type DamageType =
  | "pothole"
  | "road_crack"
  | "surface_erosion"
  | "uneven_pavement"
  | "road_subsidence"
  | "other";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export type ReportStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "rejected";

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: "pothole", label: "Pothole" },
  { value: "road_crack", label: "Road Crack" },
  { value: "surface_erosion", label: "Surface Erosion" },
  { value: "uneven_pavement", label: "Uneven Pavement" },
  { value: "road_subsidence", label: "Road Subsidence" },
  { value: "other", label: "Other" },
];

export const SEVERITIES: { value: SeverityLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "scheduled", label: "Scheduled for Repair" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export const WORKFLOW: ReportStatus[] = [
  "submitted",
  "under_review",
  "verified",
  "scheduled",
  "in_progress",
  "completed",
];

export const damageLabel = (value: string) =>
  DAMAGE_TYPES.find((d) => d.value === value)?.label ?? value;
export const severityLabel = (value: string) =>
  SEVERITIES.find((s) => s.value === value)?.label ?? value;
export const statusLabel = (value: string) =>
  STATUSES.find((s) => s.value === value)?.label ?? value;

export const SEVERITY_HEX: Record<SeverityLevel, string> = {
  low: "#1f9d55",
  medium: "#e8b209",
  high: "#ef7411",
  critical: "#dc2626",
};

/** Barangays of Borongan City, Eastern Samar. */
export const BARANGAYS = [
  "Alang-alang",
  "Amantacop",
  "Ando",
  "Bagongon",
  "Balacdas",
  "Balud",
  "Banuyo",
  "Baras",
  "Bato",
  "Bayobay",
  "Benowangan",
  "Bugas",
  "Cabalagnan",
  "Cabong",
  "Calico-an",
  "Camada",
  "Campesao",
  "Canjaway",
  "Can-abong",
  "Canlaray",
  "Divinubo",
  "Hebacong",
  "Hindang",
  "Lalawigan",
  "Libuton",
  "Locsoon",
  "Maybacong",
  "Pepelitan",
  "Pinanag-an",
  "Punta Maria",
  "Sabang North",
  "Sabang South",
  "San Andres",
  "San Gabriel",
  "San Jose",
  "San Mateo",
  "San Pablo",
  "San Saturnino",
  "Santa Fe",
  "Siha",
  "Songco",
  "Suribao",
  "Tabunan",
  "Taboc",
  "Tamoso",
  "Tycoon",
];

export const BORONGAN_CENTER: [number, number] = [11.6083, 125.4319];

export type DamageType =
  | "pothole"
  | "road_crack"
  | "surface_erosion"
  | "uneven_pavement"
  | "road_subsidence"
  | "other";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface MobileClassificationInput {
  damageType: DamageType;
  roadName: string;
  barangay: string;
  title: string;
  description?: string;
  depthCategory?: "shallow" | "medium" | "deep";
  widthCategory?: "small" | "moderate" | "large";
}

export interface MobileClassificationResult {
  score: number;
  severityLevel: SeverityLevel;
  rationale: string;
  color: string;
}

const PRIMARY_ROADS = [
  "real street",
  "samar east coastal road",
  "national highway",
  "circumferential",
  "songco coastal",
  "baybay boulevard",
];

const SECONDARY_ROADS = [
  "campesao main",
  "balud",
  "san jose",
  "san gabriel",
  "lalawigan",
  "sabang",
];

export function classifyMobileDamage(
  input: MobileClassificationInput,
): MobileClassificationResult {
  const { damageType, roadName, title, description = "", depthCategory, widthCategory } = input;
  const combined = `${title} ${description}`.toLowerCase();
  const roadLower = roadName.toLowerCase();

  // 1. Base Damage Hazard
  let basePoints = 30;
  switch (damageType) {
    case "road_subsidence":
      basePoints = 65;
      break;
    case "pothole":
      basePoints = 50;
      break;
    case "uneven_pavement":
      basePoints = 40;
      break;
    case "surface_erosion":
      basePoints = 35;
      break;
    case "road_crack":
      basePoints = 25;
      break;
    default:
      basePoints = 25;
      break;
  }

  // 2. Road Hierarchy Factor
  let roadPoints = 5;
  if (PRIMARY_ROADS.some((r) => roadLower.includes(r))) {
    roadPoints = 20;
  } else if (SECONDARY_ROADS.some((r) => roadLower.includes(r))) {
    roadPoints = 12;
  }

  // 3. Dimensions
  let dimPoints = 0;
  if (depthCategory === "deep" || combined.includes("deep")) dimPoints += 15;
  else if (depthCategory === "medium") dimPoints += 8;

  if (widthCategory === "large" || combined.includes("wide")) dimPoints += 10;
  else if (widthCategory === "moderate") dimPoints += 5;

  // 4. Hazard Keywords
  let hazardPoints = 0;
  const keywords = ["accident", "motorcycle", "tricycle", "flooded", "sharp", "crash"];
  const matched = keywords.filter((k) => combined.includes(k));
  if (matched.length >= 2) hazardPoints = 15;
  else if (matched.length === 1) hazardPoints = 8;

  const score = Math.min(100, Math.max(15, basePoints + roadPoints + dimPoints + hazardPoints));

  let severityLevel: SeverityLevel = "low";
  let color = "#16a34a"; // green

  if (score >= 80) {
    severityLevel = "critical";
    color = "#dc2626"; // red
  } else if (score >= 60) {
    severityLevel = "high";
    color = "#ea580c"; // orange
  } else if (score >= 35) {
    severityLevel = "medium";
    color = "#ca8a04"; // yellow-gold
  }

  const rationale = `Calculated score: ${score}/100 based on ${damageType.replace("_", " ")} on ${roadName}. Auto-prioritized as ${severityLevel.toUpperCase()}.`;

  return { score, severityLevel, rationale, color };
}

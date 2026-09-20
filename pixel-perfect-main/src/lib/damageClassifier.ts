import type { DamageType, SeverityLevel } from "./domain";

export interface DamageClassificationInput {
  damageType: DamageType;
  roadName: string;
  barangay: string;
  title: string;
  description?: string;
  depthCategory?: "shallow" | "medium" | "deep";
  widthCategory?: "small" | "moderate" | "large";
}

export interface AutomatedClassificationResult {
  score: number; // 0 - 100
  severityLevel: SeverityLevel;
  factors: {
    baseDamageHazard: { label: string; points: number };
    roadHierarchy: { label: string; points: number };
    dimensions: { label: string; points: number };
    hazardIndicators: { label: string; points: number };
  };
  rationale: string;
  recommendedTimeframe: string;
  suggestedAction: string;
}

// Key arterial roads in Borongan City that carry high vehicular traffic
const BORONGAN_PRIMARY_ROADS = [
  "real street",
  "samar east coastal road",
  "national highway",
  "circumferential road",
  "songco coastal",
  "airport road",
  "baybay boulevard",
];

const BORONGAN_SECONDARY_ROADS = [
  "campesao main",
  "balud",
  "san jose",
  "san gabriel",
  "lalawigan road",
  "sabang",
  "bugas",
  "bato",
];

// High-risk keywords indicating acute hazard to motorists
const HIGH_RISK_KEYWORDS = [
  "accident",
  "crash",
  "motorcycle",
  "tricycle",
  "rollover",
  "blind spot",
  "sharp",
  "flooded",
  "water pooling",
  "deep hole",
  "impassable",
  "swerve",
  "dark",
  "no street light",
  "skid",
];

/**
 * Objective 3 & Scope 4:
 * Automated data processing mechanism that classifies reported damages
 * and assigns severity levels for systematic review.
 */
export function classifyRoadDamage(
  input: DamageClassificationInput,
): AutomatedClassificationResult {
  const { damageType, roadName, title, description = "", depthCategory, widthCategory } = input;
  const combinedText = `${title} ${description}`.toLowerCase();
  const roadLower = roadName.toLowerCase().trim();

  // 1. Base Damage Type Hazard Rating
  let basePoints = 30;
  let baseLabel = "Minor surface defect";
  switch (damageType) {
    case "road_subsidence":
      basePoints = 65;
      baseLabel = "Structural road depression / subgrade subsidence (high collapse risk)";
      break;
    case "pothole":
      basePoints = 50;
      baseLabel = "Pothole cavity (wheel impact and vehicle instability hazard)";
      break;
    case "uneven_pavement":
      basePoints = 40;
      baseLabel = "Uneven pavement surface / rutting (two-wheeler instability)";
      break;
    case "surface_erosion":
      basePoints = 35;
      baseLabel = "Surface wearing / aggregate detachment (reduced skid resistance)";
      break;
    case "road_crack":
      basePoints = 25;
      baseLabel = "Surface fissure / cracking (early structural defect)";
      break;
    default:
      basePoints = 25;
      baseLabel = "Routine surface irregularity";
      break;
  }

  // 2. Road Hierarchy / Traffic Exposure Factor in Borongan City
  let roadPoints = 5;
  let roadLabel = "Local barangay access road";
  if (BORONGAN_PRIMARY_ROADS.some((r) => roadLower.includes(r))) {
    roadPoints = 20;
    roadLabel = "Primary arterial / National Highway corridor (high-speed, heavy traffic)";
  } else if (BORONGAN_SECONDARY_ROADS.some((r) => roadLower.includes(r))) {
    roadPoints = 12;
    roadLabel = "Secondary collector thoroughfare (moderate-to-high traffic volume)";
  }

  // 3. Physical Dimensions (Depth & Width)
  let dimPoints = 0;
  let dimDetails: string[] = [];

  // Depth
  if (depthCategory === "deep" || combinedText.includes("deep") || combinedText.includes("crater")) {
    dimPoints += 15;
    dimDetails.push("significant depth (>5cm)");
  } else if (depthCategory === "medium" || combinedText.includes("moderate depth")) {
    dimPoints += 8;
    dimDetails.push("moderate depth (2-5cm)");
  } else {
    dimDetails.push("shallow depth (<2cm)");
  }

  // Width
  if (widthCategory === "large" || combinedText.includes("wide") || combinedText.includes("lane wide") || combinedText.includes("huge")) {
    dimPoints += 10;
    dimDetails.push("large span (>1m)");
  } else if (widthCategory === "moderate") {
    dimPoints += 5;
    dimDetails.push("moderate span (30-100cm)");
  } else {
    dimDetails.push("localized span (<30cm)");
  }

  const dimLabel = dimDetails.join(", ");

  // 4. Hazard Risk Indicators & Contextual Multipliers
  let hazardPoints = 0;
  const detectedKeywords: string[] = [];

  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      detectedKeywords.push(keyword);
    }
  }

  if (detectedKeywords.length >= 2) {
    hazardPoints = 15;
  } else if (detectedKeywords.length === 1) {
    hazardPoints = 8;
  }

  const hazardLabel =
    detectedKeywords.length > 0
      ? `High-risk indicators identified: ${detectedKeywords.slice(0, 3).join(", ")}`
      : "Standard routine hazard profile";

  // Calculate Total Composite Severity Score (0 - 100)
  const totalScore = Math.min(100, Math.max(10, basePoints + roadPoints + dimPoints + hazardPoints));

  // Severity Level Mapping
  let severityLevel: SeverityLevel = "low";
  let recommendedTimeframe = "Schedule within standard monthly maintenance";
  let suggestedAction = "Routine monitoring and scheduled patch repair";

  if (totalScore >= 80) {
    severityLevel = "critical";
    recommendedTimeframe = "Emergency intervention within 24 hours";
    suggestedAction = "Immediate hazard sign placement & emergency asphalt/concrete restoration";
  } else if (totalScore >= 60) {
    severityLevel = "high";
    recommendedTimeframe = "Priority repair within 3 to 5 business days";
    suggestedAction = "Cold-mix or hot-mix asphalt patching; barricade warning";
  } else if (totalScore >= 35) {
    severityLevel = "medium";
    recommendedTimeframe = "Repair scheduled within 1 to 2 weeks";
    suggestedAction = "Aggregate leveling, sealing, and resurfacing";
  } else {
    severityLevel = "low";
    recommendedTimeframe = "Routine maintenance cycle (within 30 days)";
    suggestedAction = "Crack sealing and periodic surveillance";
  }

  const rationale = `Automated score: ${totalScore}/100. Classified as ${severityLevel.toUpperCase()} based on ${baseLabel.toLowerCase()} located along ${roadName} (${roadLabel.toLowerCase()}). ${detectedKeywords.length > 0 ? `Reported hazards include: ${detectedKeywords.join(", ")}.` : ""}`;

  return {
    score: totalScore,
    severityLevel,
    factors: {
      baseDamageHazard: { label: baseLabel, points: basePoints },
      roadHierarchy: { label: roadLabel, points: roadPoints },
      dimensions: { label: dimLabel, points: dimPoints },
      hazardIndicators: { label: hazardLabel, points: hazardPoints },
    },
    rationale,
    recommendedTimeframe,
    suggestedAction,
  };
}

/**
 * Borongan City Geographical Boundary Verification
 * Limitation 7: The system is exclusively designed solely for Borongan City.
 */
export const BORONGAN_BOUNDS = {
  minLat: 11.40,
  maxLat: 11.85,
  minLng: 125.25,
  maxLng: 125.55,
};

export function isWithinBoronganCity(lat: number, lng: number): boolean {
  return (
    lat >= BORONGAN_BOUNDS.minLat &&
    lat <= BORONGAN_BOUNDS.maxLat &&
    lng >= BORONGAN_BOUNDS.minLng &&
    lng <= BORONGAN_BOUNDS.maxLng
  );
}

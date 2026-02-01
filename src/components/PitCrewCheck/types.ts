export interface VehicleInputs {
  mileage: string;
  usagePattern: "city" | "highway" | "mixed" | "";
  lastServiceDate: string;
  lastServiceMileage: string;
}

export interface UsageBehaviorInputs {
  avgDailyDistance: number; // 0-200 km
  drivingStyle: "calm" | "normal" | "aggressive" | "";
  roadCondition: "smooth" | "mixed" | "rough" | "";
  loadPattern: "solo" | "passengers" | "heavy" | "";
}

export interface SymptomInput {
  id: string;
  label: string;
  checked: boolean;
  frequency: "rare" | "occasional" | "frequent";
  severity: "low" | "medium" | "high";
  conditions: string[];
}

export interface SymptomInputs {
  symptoms: SymptomInput[];
  additionalNotes: string;
}

export type InputStrength = "weak" | "medium" | "strong";

export interface RiskPrediction {
  component: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  timeWindow: string;
  preventiveAction: string;
  canWait: boolean;
  reason: string;
}

export interface PredictionResult {
  inputStrength: InputStrength;
  inputScore: number;
  predictions: RiskPrediction[];
  disclaimer: string;
  vehicleSummary: string;
}

export const SYMPTOM_OPTIONS = [
  { id: "noise", label: "Unusual noise" },
  { id: "vibration", label: "Vibration" },
  { id: "warning_lights", label: "Warning lights" },
  { id: "pull", label: "Pulling to one side" },
  { id: "overheating", label: "Overheating" },
  { id: "delay", label: "Delayed response" },
  { id: "smoke", label: "Smoke or smell" },
  { id: "leak", label: "Fluid leak" },
] as const;

export const CONDITION_OPTIONS = [
  { id: "cold_start", label: "Cold start" },
  { id: "braking", label: "While braking" },
  { id: "high_speed", label: "At high speed" },
  { id: "turning", label: "While turning" },
  { id: "idle", label: "At idle" },
  { id: "acceleration", label: "During acceleration" },
] as const;

// Pit Crew Check Types

export interface VehicleInputs {
  mileage: number | null;
  usagePattern: 'city' | 'highway' | 'mixed' | null;
  lastServiceDate: string | null;
  lastServiceMileage: number | null;
}

export interface UsageBehaviorInputs {
  averageDailyDistance: number; // km
  drivingStyle: 'calm' | 'normal' | 'aggressive';
  roadCondition: 'smooth' | 'mixed' | 'rough';
  loadPattern: 'solo' | 'passengers' | 'heavy';
}

export interface SymptomItem {
  id: string;
  label: string;
  selected: boolean;
}

export interface SymptomInputs {
  symptoms: SymptomItem[];
  frequency: 'rare' | 'occasional' | 'frequent';
  severity: 'low' | 'medium' | 'high';
  conditions: string[];
  additionalNotes: string;
}

export interface PitCrewInputData {
  vehicle: VehicleInputs;
  usage: UsageBehaviorInputs;
  symptoms: SymptomInputs;
}

export interface FailureRisk {
  component: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  estimatedWindow: string; // e.g., "5,000-10,000 km" or "2-4 weeks"
  preventiveAction: string;
  canItWait: 'yes' | 'maybe' | 'no';
  reasoning: string;
}

export interface PredictionResult {
  inputStrength: number;
  risks: FailureRisk[];
  overallAssessment: string;
  disclaimer: string;
  rawResponse: string;
}

export const DEFAULT_VEHICLE_INPUTS: VehicleInputs = {
  mileage: null,
  usagePattern: null,
  lastServiceDate: null,
  lastServiceMileage: null,
};

export const DEFAULT_USAGE_INPUTS: UsageBehaviorInputs = {
  averageDailyDistance: 30,
  drivingStyle: 'normal',
  roadCondition: 'mixed',
  loadPattern: 'solo',
};

export const DEFAULT_SYMPTOM_INPUTS: SymptomInputs = {
  symptoms: [
    { id: 'noise', label: 'Unusual noise', selected: false },
    { id: 'vibration', label: 'Vibration', selected: false },
    { id: 'warning_lights', label: 'Warning lights', selected: false },
    { id: 'pull', label: 'Pulling to one side', selected: false },
    { id: 'overheating', label: 'Overheating', selected: false },
    { id: 'delay', label: 'Delayed response', selected: false },
    { id: 'leak', label: 'Fluid leak', selected: false },
    { id: 'smell', label: 'Unusual smell', selected: false },
  ],
  frequency: 'occasional',
  severity: 'medium',
  conditions: [],
  additionalNotes: '',
};

export const CONDITION_OPTIONS = [
  { id: 'cold_start', label: 'Cold start' },
  { id: 'braking', label: 'While braking' },
  { id: 'high_speed', label: 'At high speed' },
  { id: 'turning', label: 'While turning' },
  { id: 'acceleration', label: 'During acceleration' },
  { id: 'idle', label: 'At idle' },
];

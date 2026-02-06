/**
 * OBD-II Diagnostic Trouble Code Database
 * 
 * Curated dataset of common OBD-II codes with:
 * - Human-readable descriptions
 * - Severity ratings based on drive-safety impact
 * - Common root causes (ordered by likelihood)
 * - Observable symptoms
 * 
 * Sources: SAE J2012, ISO 15031-6, real-world repair data patterns
 */

import { OBDCode } from "../types";

export const OBD_CODES: OBDCode[] = [
  // ─── Fuel & Air Metering (P00xx) ───
  {
    code: "P0100",
    description: "Mass Air Flow (MAF) Circuit Malfunction",
    severity: "medium",
    system: "fuel_air",
    commonCauses: ["Dirty MAF sensor", "Damaged MAF wiring", "Air filter clogged", "Intake leak"],
    symptoms: ["Rough idle", "Poor acceleration", "Black smoke", "Stalling"],
    estimatedCostRange: "₹2,000–₹8,000",
  },
  {
    code: "P0101",
    description: "Mass Air Flow Circuit Range/Performance",
    severity: "medium",
    system: "fuel_air",
    commonCauses: ["Dirty MAF sensor", "Vacuum leak", "Clogged air filter", "Faulty MAF sensor"],
    symptoms: ["Engine hesitation", "Poor fuel economy", "Rough idle"],
    estimatedCostRange: "₹1,500–₹6,000",
  },
  {
    code: "P0110",
    description: "Intake Air Temperature Sensor Circuit Malfunction",
    severity: "low",
    system: "fuel_air",
    commonCauses: ["Faulty IAT sensor", "Damaged wiring", "Poor connection"],
    symptoms: ["Slight performance change", "Check engine light"],
    estimatedCostRange: "₹500–₹2,000",
  },
  {
    code: "P0120",
    description: "Throttle Position Sensor Circuit Malfunction",
    severity: "high",
    system: "fuel_air",
    commonCauses: ["Faulty TPS", "Wiring damage", "Throttle body issue", "ECU fault"],
    symptoms: ["Erratic acceleration", "Surging", "Stalling", "Limp mode"],
    estimatedCostRange: "₹3,000–₹10,000",
  },
  {
    code: "P0171",
    description: "System Too Lean (Bank 1)",
    severity: "medium",
    system: "fuel_air",
    commonCauses: ["Vacuum leak", "Weak fuel pump", "Dirty fuel injectors", "Faulty O2 sensor"],
    symptoms: ["Rough idle", "Misfires", "Poor acceleration", "Increased emissions"],
    estimatedCostRange: "₹2,000–₹12,000",
  },
  {
    code: "P0172",
    description: "System Too Rich (Bank 1)",
    severity: "medium",
    system: "fuel_air",
    commonCauses: ["Leaking fuel injector", "Faulty O2 sensor", "Stuck fuel pressure regulator", "Dirty air filter"],
    symptoms: ["Black smoke", "Fuel smell", "Poor fuel economy", "Rough idle"],
    estimatedCostRange: "₹2,000–₹10,000",
  },

  // ─── Ignition System (P03xx) ───
  {
    code: "P0300",
    description: "Random/Multiple Cylinder Misfire Detected",
    severity: "high",
    system: "ignition",
    commonCauses: ["Worn spark plugs", "Faulty ignition coils", "Fuel delivery issue", "Compression loss"],
    symptoms: ["Engine shaking", "Loss of power", "Poor fuel economy", "Catalytic converter damage risk"],
    estimatedCostRange: "₹3,000–₹15,000",
  },
  {
    code: "P0301",
    description: "Cylinder 1 Misfire Detected",
    severity: "high",
    system: "ignition",
    commonCauses: ["Bad spark plug (cyl 1)", "Faulty coil pack", "Fuel injector issue", "Low compression"],
    symptoms: ["Rough idle", "Vibration", "Loss of power", "Check engine flashing"],
    estimatedCostRange: "₹1,500–₹8,000",
  },
  {
    code: "P0302",
    description: "Cylinder 2 Misfire Detected",
    severity: "high",
    system: "ignition",
    commonCauses: ["Bad spark plug (cyl 2)", "Faulty coil pack", "Injector blockage", "Valve issue"],
    symptoms: ["Rough idle", "Vibration", "Loss of power"],
    estimatedCostRange: "₹1,500–₹8,000",
  },
  {
    code: "P0303",
    description: "Cylinder 3 Misfire Detected",
    severity: "high",
    system: "ignition",
    commonCauses: ["Bad spark plug (cyl 3)", "Faulty coil pack", "Injector blockage"],
    symptoms: ["Rough idle", "Engine vibration", "Power loss"],
    estimatedCostRange: "₹1,500–₹8,000",
  },
  {
    code: "P0304",
    description: "Cylinder 4 Misfire Detected",
    severity: "high",
    system: "ignition",
    commonCauses: ["Bad spark plug (cyl 4)", "Faulty coil pack", "Injector issue"],
    symptoms: ["Rough idle", "Vibration", "Loss of power"],
    estimatedCostRange: "₹1,500–₹8,000",
  },
  {
    code: "P0335",
    description: "Crankshaft Position Sensor A Circuit Malfunction",
    severity: "critical",
    system: "ignition",
    commonCauses: ["Faulty CKP sensor", "Damaged reluctor ring", "Wiring issue", "ECU fault"],
    symptoms: ["No start", "Intermittent stalling", "Engine cuts out"],
    estimatedCostRange: "₹2,000–₹6,000",
  },
  {
    code: "P0340",
    description: "Camshaft Position Sensor Circuit Malfunction",
    severity: "high",
    system: "ignition",
    commonCauses: ["Faulty CMP sensor", "Timing chain stretch", "Wiring fault"],
    symptoms: ["Hard starting", "Rough idle", "Stalling", "Loss of power"],
    estimatedCostRange: "₹2,000–₹5,000",
  },

  // ─── Emission Controls (P04xx) ───
  {
    code: "P0401",
    description: "Exhaust Gas Recirculation (EGR) Flow Insufficient",
    severity: "medium",
    system: "emissions",
    commonCauses: ["Carbon buildup in EGR", "Faulty EGR valve", "Clogged EGR passages", "Vacuum leak"],
    symptoms: ["Rough idle", "Pinging/knocking", "Failed emissions test"],
    estimatedCostRange: "₹3,000–₹8,000",
  },
  {
    code: "P0420",
    description: "Catalyst System Efficiency Below Threshold (Bank 1)",
    severity: "medium",
    system: "emissions",
    commonCauses: ["Worn catalytic converter", "O2 sensor degradation", "Exhaust leak", "Engine misfire damage"],
    symptoms: ["Reduced performance", "Sulfur smell", "Failed emissions"],
    estimatedCostRange: "₹8,000–₹25,000",
  },
  {
    code: "P0440",
    description: "Evaporative Emission Control System Malfunction",
    severity: "low",
    system: "emissions",
    commonCauses: ["Loose gas cap", "EVAP canister leak", "Purge valve fault", "Vent valve issue"],
    symptoms: ["Check engine light", "Fuel odor"],
    estimatedCostRange: "₹500–₹5,000",
  },
  {
    code: "P0442",
    description: "EVAP System Small Leak Detected",
    severity: "low",
    system: "emissions",
    commonCauses: ["Loose or cracked gas cap", "Small EVAP hose leak", "Canister crack"],
    symptoms: ["Check engine light", "Slight fuel smell"],
    estimatedCostRange: "₹500–₹3,000",
  },
  {
    code: "P0455",
    description: "EVAP System Large Leak Detected",
    severity: "medium",
    system: "emissions",
    commonCauses: ["Missing gas cap", "Disconnected EVAP hose", "Cracked charcoal canister"],
    symptoms: ["Strong fuel smell", "Check engine light"],
    estimatedCostRange: "₹1,000–₹5,000",
  },

  // ─── Vehicle Speed & Idle Control (P05xx) ───
  {
    code: "P0500",
    description: "Vehicle Speed Sensor Malfunction",
    severity: "medium",
    system: "drivetrain",
    commonCauses: ["Faulty VSS", "Wiring damage", "Speedometer gear issue"],
    symptoms: ["Speedometer not working", "Erratic shifting", "ABS light on"],
    estimatedCostRange: "₹1,500–₹4,000",
  },
  {
    code: "P0505",
    description: "Idle Control System Malfunction",
    severity: "medium",
    system: "fuel_air",
    commonCauses: ["Dirty idle air control valve", "Vacuum leak", "Throttle body carbon buildup"],
    symptoms: ["Erratic idle speed", "Stalling at stops", "High idle"],
    estimatedCostRange: "₹2,000–₹6,000",
  },

  // ─── Transmission (P07xx) ───
  {
    code: "P0700",
    description: "Transmission Control System Malfunction",
    severity: "high",
    system: "transmission",
    commonCauses: ["TCM fault", "Wiring issue", "Solenoid failure", "Low transmission fluid"],
    symptoms: ["Harsh shifting", "Limp mode", "Transmission warning light"],
    estimatedCostRange: "₹5,000–₹30,000",
  },
  {
    code: "P0715",
    description: "Input/Turbine Speed Sensor Circuit Malfunction",
    severity: "high",
    system: "transmission",
    commonCauses: ["Faulty speed sensor", "Wiring damage", "Contaminated fluid"],
    symptoms: ["Erratic shifting", "Speedometer issues", "Limp mode"],
    estimatedCostRange: "₹3,000–₹8,000",
  },
  {
    code: "P0730",
    description: "Incorrect Gear Ratio",
    severity: "critical",
    system: "transmission",
    commonCauses: ["Worn transmission internals", "Low/contaminated fluid", "Solenoid failure", "Valve body wear"],
    symptoms: ["Slipping gears", "Delayed engagement", "RPM flare"],
    estimatedCostRange: "₹10,000–₹50,000",
  },

  // ─── Powertrain (P0xxx misc) ───
  {
    code: "P0128",
    description: "Coolant Thermostat Below Regulating Temperature",
    severity: "low",
    system: "cooling",
    commonCauses: ["Stuck-open thermostat", "Faulty coolant temp sensor", "Low coolant"],
    symptoms: ["Slow warm-up", "Poor heater output", "Lower fuel economy"],
    estimatedCostRange: "₹1,000–₹3,000",
  },
  {
    code: "P0217",
    description: "Engine Overtemperature Condition",
    severity: "critical",
    system: "cooling",
    commonCauses: ["Low coolant", "Failed water pump", "Stuck thermostat", "Radiator blockage", "Head gasket leak"],
    symptoms: ["Temperature gauge high", "Steam from engine", "Loss of power", "Possible engine damage"],
    estimatedCostRange: "₹3,000–₹50,000+",
  },
  {
    code: "P0562",
    description: "System Voltage Low",
    severity: "medium",
    system: "electrical",
    commonCauses: ["Weak battery", "Failing alternator", "Corroded terminals", "Parasitic drain"],
    symptoms: ["Dim lights", "Slow cranking", "Electrical malfunctions"],
    estimatedCostRange: "₹3,000–₹10,000",
  },

  // ─── Body Codes (B-codes) ───
  {
    code: "B1000",
    description: "ECU Internal Circuit Malfunction",
    severity: "high",
    system: "electrical",
    commonCauses: ["ECU hardware failure", "Power supply issue", "Water ingress"],
    symptoms: ["Multiple warning lights", "Random electrical issues"],
    estimatedCostRange: "₹10,000–₹30,000",
  },

  // ─── Chassis Codes (C-codes) ───
  {
    code: "C0035",
    description: "Left Front Wheel Speed Sensor Circuit Malfunction",
    severity: "medium",
    system: "brakes",
    commonCauses: ["Faulty ABS sensor", "Damaged tone ring", "Wiring issue", "Bearing wear"],
    symptoms: ["ABS light on", "Traction control disabled", "Longer braking distance"],
    estimatedCostRange: "₹2,000–₹6,000",
  },
];

/**
 * Lookup an OBD-II code by its code string.
 * Returns undefined if code is not in the database.
 */
export const lookupOBDCode = (code: string): OBDCode | undefined => {
  const normalized = code.toUpperCase().trim();
  return OBD_CODES.find((c) => c.code === normalized);
};

/**
 * Search OBD codes by symptom keyword.
 * Returns all codes whose symptoms contain the keyword.
 */
export const searchOBDBySymptom = (symptom: string): OBDCode[] => {
  const lower = symptom.toLowerCase();
  return OBD_CODES.filter((c) =>
    c.symptoms.some((s) => s.toLowerCase().includes(lower)) ||
    c.description.toLowerCase().includes(lower)
  );
};

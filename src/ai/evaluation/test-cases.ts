/**
 * Evaluation Test Cases
 * 
 * Each test case defines:
 * - A natural language query
 * - The expected category classification
 * - Expected top match IDs (at least one should appear in top results)
 * - A description of what the test validates
 * 
 * These test cases cover:
 * - Direct keyword matches
 * - Paraphrased queries (different wording, same intent)
 * - OBD code lookups
 * - Edge cases (vague queries, compound issues)
 */

import { TestCase } from "../types";

export const TEST_CASES: TestCase[] = [
  // ─── Diagnostic Pattern Tests ───
  {
    id: "test-001",
    query: "my car is overheating on the highway",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-001"],
    description: "Direct symptom match for engine overheating",
  },
  {
    id: "test-002",
    query: "engine temperature gauge is in the red zone",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-001"],
    description: "Paraphrased overheating query using gauge terminology",
  },
  {
    id: "test-003",
    query: "car won't start when I turn the key, nothing happens",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-002"],
    description: "No-crank no-start scenario",
  },
  {
    id: "test-004",
    query: "engine cranks but won't fire up",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-003"],
    description: "Cranks but no-start — fuel/ignition issue",
  },
  {
    id: "test-005",
    query: "brake pedal goes to the floor",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-004"],
    description: "Spongy/soft brake pedal symptom",
  },
  {
    id: "test-006",
    query: "steering wheel shakes at 80 kmph",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-005"],
    description: "Vibration at highway speed",
  },
  {
    id: "test-007",
    query: "white smoke coming from exhaust pipe",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-006"],
    description: "White exhaust smoke — head gasket indicator",
  },
  {
    id: "test-008",
    query: "check engine light is blinking",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-009"],
    description: "Flashing CEL — critical misfire",
  },

  // ─── OBD Code Tests ───
  {
    id: "test-009",
    query: "what does P0420 mean?",
    expectedCategory: "obd_code",
    expectedTopMatchIds: ["P0420"],
    description: "Direct OBD code lookup",
  },
  {
    id: "test-010",
    query: "P0300 code on my scanner",
    expectedCategory: "obd_code",
    expectedTopMatchIds: ["P0300"],
    description: "OBD code with context about scanner",
  },
  {
    id: "test-011",
    query: "getting error code P0171 on my Maruti",
    expectedCategory: "obd_code",
    expectedTopMatchIds: ["P0171"],
    description: "OBD code with vehicle mention",
  },

  // ─── Maintenance Guide Tests ───
  {
    id: "test-012",
    query: "how often should I change engine oil",
    expectedCategory: "maintenance_guide",
    expectedTopMatchIds: ["maint-001"],
    description: "Oil change interval query",
  },
  {
    id: "test-013",
    query: "when to replace brake pads",
    expectedCategory: "maintenance_guide",
    expectedTopMatchIds: ["maint-002"],
    description: "Brake pad replacement timing",
  },
  {
    id: "test-014",
    query: "tire rotation schedule for my car",
    expectedCategory: "maintenance_guide",
    expectedTopMatchIds: ["maint-003"],
    description: "Tire rotation interval query",
  },
  {
    id: "test-015",
    query: "timing belt replacement interval",
    expectedCategory: "maintenance_guide",
    expectedTopMatchIds: ["maint-006"],
    description: "Critical maintenance — timing belt",
  },

  // ─── Component Info Tests ───
  {
    id: "test-016",
    query: "what does a catalytic converter do",
    expectedCategory: "component_info",
    expectedTopMatchIds: ["comp-001"],
    description: "Component explanation query",
  },
  {
    id: "test-017",
    query: "how does a turbocharger work",
    expectedCategory: "component_info",
    expectedTopMatchIds: ["comp-004"],
    description: "Turbocharger function explanation",
  },

  // ─── FAQ Tests ───
  {
    id: "test-018",
    query: "when should I replace my car battery",
    expectedCategory: "faq",
    expectedTopMatchIds: ["faq-001"],
    description: "Battery replacement FAQ",
  },
  {
    id: "test-019",
    query: "what does the ABS light mean on my dashboard",
    expectedCategory: "faq",
    expectedTopMatchIds: ["faq-002"],
    description: "ABS warning light FAQ",
  },
  {
    id: "test-020",
    query: "can I keep driving with oil light on",
    expectedCategory: "faq",
    expectedTopMatchIds: ["faq-003"],
    description: "Critical safety FAQ — oil pressure",
  },

  // ─── Vehicle Complaint Tests ───
  {
    id: "test-021",
    query: "AC is blowing warm air",
    expectedCategory: "vehicle_complaint",
    expectedTopMatchIds: ["comp-005"],
    description: "AC not cooling complaint",
  },
  {
    id: "test-022",
    query: "battery dies every morning",
    expectedCategory: "vehicle_complaint",
    expectedTopMatchIds: ["comp-006"],
    description: "Parasitic drain complaint",
  },

  // ─── Edge Cases ───
  {
    id: "test-023",
    query: "car making weird noise",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-010", "diag-005"],
    description: "Vague query — should still find relevant diagnostics",
  },
  {
    id: "test-024",
    query: "my fuel consumption has increased suddenly",
    expectedCategory: "diagnostic_pattern",
    expectedTopMatchIds: ["diag-011"],
    description: "Paraphrased fuel economy issue",
  },
];

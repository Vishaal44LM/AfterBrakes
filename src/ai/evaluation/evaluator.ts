/**
 * Evaluation Framework
 * 
 * Computes standard IR/ML metrics:
 * - Accuracy: fraction of correctly classified queries
 * - Precision: of the returned matches, how many were expected
 * - Recall: of the expected matches, how many were returned
 * - F1 Score: harmonic mean of precision and recall
 * 
 * F1 = 2 × (Precision × Recall) / (Precision + Recall)
 */

import { InferenceEngine } from "../inference/engine";
import { TestCase, EvaluationResult, EvaluationSummary } from "../types";
import { TEST_CASES } from "./test-cases";

/**
 * Run a single test case against the engine.
 */
const evaluateTestCase = (
  engine: InferenceEngine,
  testCase: TestCase
): EvaluationResult => {
  const result = engine.query(testCase.query, 5);

  const actualCategory = result.classification.category;
  const categoryCorrect = actualCategory === testCase.expectedCategory;

  const actualMatchIds = result.matches.map((m) => m.entry.id);
  const expectedSet = new Set(testCase.expectedTopMatchIds);
  const actualSet = new Set(actualMatchIds);

  // True positives: in both expected and actual
  let truePositives = 0;
  for (const id of expectedSet) {
    if (actualSet.has(id)) truePositives++;
  }

  // Precision: TP / |actual results|
  const precision =
    actualMatchIds.length > 0 ? truePositives / actualMatchIds.length : 0;

  // Recall: TP / |expected results|
  const recall =
    testCase.expectedTopMatchIds.length > 0
      ? truePositives / testCase.expectedTopMatchIds.length
      : 0;

  // F1 Score
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  const passed = categoryCorrect && recall > 0;

  const details = passed
    ? `✓ Correctly classified as '${actualCategory}' and found expected match(es)`
    : `✗ ${!categoryCorrect ? `Expected category '${testCase.expectedCategory}', got '${actualCategory}'` : ""}${
        recall === 0 ? ` Expected match IDs [${testCase.expectedTopMatchIds}] not found in results [${actualMatchIds}]` : ""
      }`.trim();

  return {
    testCaseId: testCase.id,
    passed,
    expectedCategory: testCase.expectedCategory,
    actualCategory,
    categoryCorrect,
    expectedMatchIds: testCase.expectedTopMatchIds,
    actualMatchIds,
    matchPrecision: precision,
    matchRecall: recall,
    f1Score: f1,
    details,
  };
};

/**
 * Run all test cases and produce evaluation summary.
 */
export const runEvaluation = (engine: InferenceEngine): EvaluationSummary => {
  const results = TEST_CASES.map((tc) => evaluateTestCase(engine, tc));

  const passed = results.filter((r) => r.passed).length;
  const accuracy = results.length > 0 ? passed / results.length : 0;
  const avgPrecision =
    results.reduce((sum, r) => sum + r.matchPrecision, 0) / results.length;
  const avgRecall =
    results.reduce((sum, r) => sum + r.matchRecall, 0) / results.length;
  const avgF1 =
    results.reduce((sum, r) => sum + r.f1Score, 0) / results.length;

  return {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    accuracy,
    avgPrecision,
    avgRecall,
    avgF1,
    results,
  };
};

/**
 * After Brakes AI Engine — Shared Type Definitions
 * 
 * Architecture: Data Layer → Model Layer → Inference Layer → UI Layer
 * All types are designed for explainability and transparency.
 */

// ─── Data Layer Types ───

export type KnowledgeCategory =
  | "diagnostic_pattern"
  | "obd_code"
  | "maintenance_guide"
  | "component_info"
  | "faq"
  | "vehicle_complaint";

export type Severity = "low" | "medium" | "high" | "critical";

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
  severity: Severity;
  relatedComponents: string[];
  metadata?: Record<string, string>;
}

export interface OBDCode {
  code: string;
  description: string;
  severity: Severity;
  system: string;
  commonCauses: string[];
  symptoms: string[];
  estimatedCostRange?: string;
}

// ─── Preprocessing Types ───

export interface TokenizedDocument {
  id: string;
  originalText: string;
  tokens: string[];
  stems: string[];
}

// ─── Model Layer Types ───

export interface TFIDFVector {
  docId: string;
  vector: Map<string, number>;
  magnitude: number;
}

export interface SimilarityResult {
  docId: string;
  score: number;
  method: "cosine" | "bm25" | "jaccard";
}

export interface ClassificationResult {
  category: KnowledgeCategory;
  confidence: number;
  scores: Record<string, number>;
}

// ─── Inference Layer Types ───

export interface InferenceResult {
  query: string;
  matches: MatchResult[];
  classification: ClassificationResult;
  explanation: ResultExplanation;
  processingTimeMs: number;
}

export interface MatchResult {
  entry: KnowledgeEntry;
  relevanceScore: number;
  similarityMethod: string;
  matchedKeywords: string[];
  confidenceBand: "high" | "medium" | "low";
}

export interface ResultExplanation {
  summary: string;
  whyThisResult: string[];
  confidenceScore: number;
  confidenceReason: string;
  similarityMetrics: {
    method: string;
    score: number;
    formula: string;
  }[];
  tokenOverlap: {
    queryTokens: string[];
    matchedTokens: string[];
    overlapRatio: number;
  };
}

// ─── Evaluation Types ───

export interface TestCase {
  id: string;
  query: string;
  expectedCategory: KnowledgeCategory;
  expectedTopMatchIds: string[];
  description: string;
}

export interface EvaluationResult {
  testCaseId: string;
  passed: boolean;
  expectedCategory: KnowledgeCategory;
  actualCategory: KnowledgeCategory;
  categoryCorrect: boolean;
  expectedMatchIds: string[];
  actualMatchIds: string[];
  matchPrecision: number;
  matchRecall: number;
  f1Score: number;
  details: string;
}

export interface EvaluationSummary {
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
  avgPrecision: number;
  avgRecall: number;
  avgF1: number;
  results: EvaluationResult[];
}

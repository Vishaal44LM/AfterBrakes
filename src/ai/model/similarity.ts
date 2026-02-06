/**
 * Similarity Metrics Module
 * 
 * Implements three complementary similarity measures:
 * 
 * 1. Cosine Similarity (TF-IDF based)
 * 2. BM25 (Okapi BM25 ranking)
 * 3. Jaccard Similarity (set overlap)
 * 
 * Each serves a different purpose in the matching pipeline.
 */

import { TFIDFVector, SimilarityResult } from "../types";

/**
 * Cosine Similarity
 * ─────────────────
 * 
 * Formula: cos(A, B) = (A · B) / (|A| × |B|)
 * 
 * Where:
 *   A · B = Σ(A_i × B_i)  (dot product of TF-IDF vectors)
 *   |A| = √(Σ A_i²)       (Euclidean magnitude of vector A)
 *   |B| = √(Σ B_i²)       (Euclidean magnitude of vector B)
 * 
 * Properties:
 * - Range: [0, 1] for non-negative TF-IDF values
 * - 1 = identical direction (same term distribution)
 * - 0 = completely different (no shared terms)
 * - Length-independent: a 10-word query can match a 500-word document
 * 
 * Why cosine for automotive search?
 * - Handles varying document lengths (short FAQ vs long diagnostic guide)
 * - TF-IDF weighting already handles term importance
 * - Fast computation with sparse vectors
 */
export const cosineSimilarity = (
  vecA: TFIDFVector,
  vecB: TFIDFVector
): number => {
  if (vecA.magnitude === 0 || vecB.magnitude === 0) return 0;

  let dotProduct = 0;

  // Only iterate over the smaller vector for efficiency
  const [smaller, larger] =
    vecA.vector.size <= vecB.vector.size ? [vecA, vecB] : [vecB, vecA];

  for (const [term, weightA] of smaller.vector) {
    const weightB = larger.vector.get(term);
    if (weightB !== undefined) {
      dotProduct += weightA * weightB;
    }
  }

  return dotProduct / (vecA.magnitude * vecB.magnitude);
};

/**
 * BM25 (Okapi BM25) Scoring
 * ──────────────────────────
 * 
 * Formula:
 * score(D, Q) = Σ IDF(q_i) × [f(q_i, D) × (k1 + 1)] / [f(q_i, D) + k1 × (1 - b + b × |D|/avgdl)]
 * 
 * Where:
 *   f(q_i, D) = frequency of query term q_i in document D
 *   |D| = length of document D (in terms)
 *   avgdl = average document length across corpus
 *   k1 = term frequency saturation parameter (typically 1.2-2.0)
 *   b = length normalization parameter (typically 0.75)
 * 
 * Key differences from TF-IDF cosine:
 * - Term frequency saturates (diminishing returns for repeated terms)
 * - Explicit document length normalization
 * - Better for ranking (originally designed for information retrieval)
 * 
 * Why BM25 as a secondary metric?
 * - More robust when documents vary greatly in length
 * - Saturation prevents keyword-stuffed entries from dominating
 * - Industry-standard ranking algorithm (used by Elasticsearch, Lucene)
 */
export const bm25Score = (
  queryTerms: string[],
  docTerms: string[],
  idfLookup: (term: string) => number,
  avgDocLength: number,
  k1: number = 1.5,
  b: number = 0.75
): number => {
  const docLength = docTerms.length;
  if (docLength === 0 || queryTerms.length === 0) return 0;

  // Count term frequencies in document
  const termFreq = new Map<string, number>();
  for (const term of docTerms) {
    termFreq.set(term, (termFreq.get(term) || 0) + 1);
  }

  let score = 0;
  for (const queryTerm of queryTerms) {
    const freq = termFreq.get(queryTerm) || 0;
    if (freq === 0) continue;

    const idf = idfLookup(queryTerm);
    
    // BM25 term score with saturation
    const numerator = freq * (k1 + 1);
    const denominator = freq + k1 * (1 - b + b * (docLength / avgDocLength));
    
    score += idf * (numerator / denominator);
  }

  return score;
};

/**
 * Jaccard Similarity
 * ──────────────────
 * 
 * Formula: J(A, B) = |A ∩ B| / |A ∪ B|
 * 
 * Where:
 *   A ∩ B = terms present in both sets
 *   A ∪ B = terms present in either set
 * 
 * Properties:
 * - Range: [0, 1]
 * - 1 = identical sets
 * - 0 = no overlap
 * - Simple set-based metric (ignores frequency)
 * 
 * Why Jaccard?
 * - Fast baseline metric
 * - Useful for keyword matching (do these terms overlap at all?)
 * - Helps catch cases where TF-IDF/BM25 might miss obvious matches
 */
export const jaccardSimilarity = (
  setA: Set<string>,
  setB: Set<string>
): number => {
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Compute all similarity metrics between a query and a document.
 * Returns a combined relevance score using weighted fusion.
 * 
 * Fusion weights:
 *   cosine: 0.45 (primary semantic similarity)
 *   BM25:   0.40 (ranking relevance)
 *   Jaccard: 0.15 (keyword overlap baseline)
 * 
 * These weights were chosen because:
 * - Cosine + TF-IDF captures semantic similarity well
 * - BM25 provides robust ranking with length normalization
 * - Jaccard acts as a safety net for obvious keyword matches
 */
export const computeCombinedScore = (
  cosine: number,
  bm25: number,
  jaccard: number,
  maxBM25: number
): number => {
  // Normalize BM25 to [0, 1] range using the max score in the result set
  const normalizedBM25 = maxBM25 > 0 ? bm25 / maxBM25 : 0;

  return 0.45 * cosine + 0.40 * normalizedBM25 + 0.15 * jaccard;
};

/**
 * Rank documents by combined similarity to a query.
 * Returns top-K results sorted by relevance.
 */
export const rankDocuments = (
  results: SimilarityResult[],
  topK: number = 5
): SimilarityResult[] => {
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

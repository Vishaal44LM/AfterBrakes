/**
 * Intent & Category Classifier
 * 
 * Implements a lightweight Naive Bayes-inspired classifier
 * with TF-IDF feature weighting for categorizing user queries.
 * 
 * Algorithm:
 * ──────────
 * 1. For each category, compute a centroid vector (average TF-IDF of all docs in that category)
 * 2. For a new query, compute its TF-IDF vector
 * 3. Find the category whose centroid is most similar (cosine similarity)
 * 4. Confidence = similarity to best match / sum of all similarities
 * 
 * This is a Rocchio-style nearest-centroid classifier:
 * - Simple, interpretable, no training loop needed
 * - Works well with small, curated datasets
 * - Each prediction is explainable (which centroid was closest and why)
 * 
 * Categories:
 * - diagnostic_pattern: "my car is making a noise..."
 * - obd_code: "P0420", "what does P0301 mean"
 * - maintenance_guide: "when should I change oil..."
 * - component_info: "what is a catalytic converter..."
 * - faq: "is it safe to...", "how often should I..."
 * - vehicle_complaint: "AC not working", "battery draining"
 */

import { KnowledgeCategory, ClassificationResult, TFIDFVector } from "../types";
import { cosineSimilarity } from "./similarity";

// Category-level keyword indicators (manually curated)
// These boost classification accuracy for clear-cut queries
const CATEGORY_INDICATORS: Record<KnowledgeCategory, string[]> = {
  diagnostic_pattern: [
    "noise", "smoke", "vibrat", "shak", "pull", "leak", "smell",
    "overheat", "stall", "misfire", "rough", "idle", "start",
    "won't", "doesn't", "problem", "issue", "wrong", "failing",
  ],
  obd_code: [
    "p0", "p1", "p2", "p3", "c0", "b0", "b1", "u0",
    "code", "dtc", "obd", "scanner", "diagnostic", "trouble",
  ],
  maintenance_guide: [
    "change", "interval", "service", "replac", "schedule", "maintain",
    "how often", "when should", "due", "overdue", "flush", "rotat",
  ],
  component_info: [
    "what is", "what does", "how does", "explain", "function",
    "work", "purpose", "component", "part", "system",
  ],
  faq: [
    "should i", "can i", "is it", "safe", "normal", "mean",
    "difference", "between", "compare", "recommend", "best",
  ],
  vehicle_complaint: [
    "not working", "broken", "failed", "draining", "slipping",
    "leaking", "stuck", "worn", "damaged", "cracked",
  ],
};

export class CategoryClassifier {
  private centroids: Map<KnowledgeCategory, TFIDFVector> = new Map();
  private isBuilt = false;

  /**
   * Build category centroids from labeled documents.
   * 
   * @param documents - Array of [category, TFIDFVector] pairs
   */
  buildCentroids(documents: [KnowledgeCategory, TFIDFVector][]): void {
    const categoryDocs = new Map<KnowledgeCategory, TFIDFVector[]>();

    for (const [category, vector] of documents) {
      if (!categoryDocs.has(category)) {
        categoryDocs.set(category, []);
      }
      categoryDocs.get(category)!.push(vector);
    }

    // Compute centroid for each category (average vector)
    for (const [category, vectors] of categoryDocs) {
      const centroid = this.averageVectors(category, vectors);
      this.centroids.set(category, centroid);
    }

    this.isBuilt = true;
  }

  /**
   * Classify a query into a category.
   * Returns category with confidence score and all category scores.
   */
  classify(queryVector: TFIDFVector, queryText: string): ClassificationResult {
    if (!this.isBuilt) {
      throw new Error("Classifier: must call buildCentroids() first");
    }

    const scores: Record<string, number> = {};
    let totalScore = 0;
    let bestCategory: KnowledgeCategory = "faq";
    let bestScore = -1;

    const lowerQuery = queryText.toLowerCase();

    for (const [category, centroid] of this.centroids) {
      // Base score from cosine similarity with centroid
      let score = cosineSimilarity(queryVector, centroid);

      // Boost from keyword indicators
      const indicators = CATEGORY_INDICATORS[category] || [];
      let indicatorHits = 0;
      for (const indicator of indicators) {
        if (lowerQuery.includes(indicator)) {
          indicatorHits++;
        }
      }
      // Add indicator boost (capped at 0.3)
      const indicatorBoost = Math.min(indicatorHits * 0.08, 0.3);
      score += indicatorBoost;

      // OBD code pattern detection (regex)
      if (category === "obd_code" && /[pbcu]\d{4}/i.test(lowerQuery)) {
        score += 0.5;
      }

      scores[category] = score;
      totalScore += score;

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Normalize scores to get confidence
    const confidence = totalScore > 0 ? bestScore / totalScore : 0;

    return {
      category: bestCategory,
      confidence: Math.min(confidence, 1),
      scores,
    };
  }

  /**
   * Compute the average (centroid) of multiple TF-IDF vectors.
   */
  private averageVectors(
    docId: string,
    vectors: TFIDFVector[]
  ): TFIDFVector {
    const sumVector = new Map<string, number>();
    const n = vectors.length;

    for (const vec of vectors) {
      for (const [term, weight] of vec.vector) {
        sumVector.set(term, (sumVector.get(term) || 0) + weight);
      }
    }

    // Average each dimension
    const avgVector = new Map<string, number>();
    let magnitudeSquared = 0;
    for (const [term, sum] of sumVector) {
      const avg = sum / n;
      avgVector.set(term, avg);
      magnitudeSquared += avg * avg;
    }

    return {
      docId: `centroid_${docId}`,
      vector: avgVector,
      magnitude: Math.sqrt(magnitudeSquared),
    };
  }
}

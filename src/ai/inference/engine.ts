/**
 * After Brakes AI Inference Engine
 * 
 * The central orchestrator that connects:
 *   Data Layer (knowledge base, OBD codes)
 *   → Preprocessing (tokenize, stem)
 *   → Model Layer (TF-IDF, similarity, classifier)
 *   → Explainability (confidence, reasoning)
 * 
 * Pipeline:
 * ─────────
 * 1. Receive raw query text
 * 2. Detect OBD codes (regex pattern match)
 * 3. Preprocess: tokenize → remove stopwords → stem
 * 4. Vectorize query using TF-IDF
 * 5. Classify intent (which category is this about?)
 * 6. Score all knowledge base entries (cosine + BM25 + Jaccard)
 * 7. Rank and select top matches
 * 8. Generate explainability report
 * 9. Return InferenceResult
 */

import { KNOWLEDGE_BASE } from "../data/automotive-kb";
import { OBD_CODES, lookupOBDCode } from "../data/obd-codes";
import { preprocess, createTokenizedDocument, tokenize, removeStopwords, stem } from "../preprocessing";
import { TFIDFVectorizer } from "../model/tfidf";
import { cosineSimilarity, bm25Score, jaccardSimilarity, computeCombinedScore } from "../model/similarity";
import { CategoryClassifier } from "../model/classifier";
import {
  InferenceResult,
  MatchResult,
  ResultExplanation,
  KnowledgeEntry,
  KnowledgeCategory,
} from "../types";

export class InferenceEngine {
  private vectorizer: TFIDFVectorizer;
  private classifier: CategoryClassifier;
  private docTokens: Map<string, string[]> = new Map();
  private docVectors: Map<string, ReturnType<TFIDFVectorizer["vectorize"]>> = new Map();
  private avgDocLength: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.vectorizer = new TFIDFVectorizer();
    this.classifier = new CategoryClassifier();
  }

  /**
   * Initialize the engine: index all knowledge base entries.
   * Must be called once before querying.
   */
  initialize(): void {
    const startTime = performance.now();

    // Prepare documents
    const documents: [string, string[]][] = [];
    const classifierDocs: [KnowledgeCategory, ReturnType<TFIDFVectorizer["vectorize"]>][] = [];
    let totalTokens = 0;

    for (const entry of KNOWLEDGE_BASE) {
      // Combine title, content, and keywords for richer representation
      const fullText = `${entry.title} ${entry.content} ${entry.keywords.join(" ")}`;
      const tokens = preprocess(fullText);
      
      this.docTokens.set(entry.id, tokens);
      documents.push([entry.id, tokens]);
      totalTokens += tokens.length;
    }

    // Also index OBD codes as documents
    for (const code of OBD_CODES) {
      const fullText = `${code.code} ${code.description} ${code.commonCauses.join(" ")} ${code.symptoms.join(" ")}`;
      const tokens = preprocess(fullText);
      
      this.docTokens.set(code.code, tokens);
      documents.push([code.code, tokens]);
      totalTokens += tokens.length;
    }

    this.avgDocLength = totalTokens / documents.length;

    // Build TF-IDF index
    this.vectorizer.buildIndex(documents);

    // Vectorize all documents
    for (const [docId, tokens] of documents) {
      const vector = this.vectorizer.vectorize(docId, tokens);
      this.docVectors.set(docId, vector);
    }

    // Build classifier centroids
    for (const entry of KNOWLEDGE_BASE) {
      const vector = this.docVectors.get(entry.id)!;
      classifierDocs.push([entry.category, vector]);
    }
    this.classifier.buildCentroids(classifierDocs);

    this.isInitialized = true;

    const elapsed = performance.now() - startTime;
    console.log(
      `[AI Engine] Initialized in ${elapsed.toFixed(1)}ms | ` +
      `${KNOWLEDGE_BASE.length} KB entries + ${OBD_CODES.length} OBD codes | ` +
      `Vocabulary: ${this.vectorizer.getVocabularySize()} terms`
    );
  }

  /**
   * Run inference on a user query.
   * Returns matches, classification, and full explainability report.
   */
  query(rawQuery: string, topK: number = 5): InferenceResult {
    if (!this.isInitialized) {
      this.initialize();
    }

    const startTime = performance.now();

    // Step 1: Check for OBD code pattern
    const obdMatch = rawQuery.match(/[PBCU]\d{4}/i);
    let obdEntry: KnowledgeEntry | undefined;
    
    if (obdMatch) {
      const code = lookupOBDCode(obdMatch[0]);
      if (code) {
        obdEntry = {
          id: code.code,
          category: "obd_code",
          title: `${code.code}: ${code.description}`,
          content: `${code.description}. Common causes: ${code.commonCauses.join(", ")}. Symptoms: ${code.symptoms.join(", ")}. Estimated cost: ${code.estimatedCostRange || "varies"}.`,
          keywords: [code.code.toLowerCase(), ...code.commonCauses.map(c => c.toLowerCase()), ...code.symptoms.map(s => s.toLowerCase())],
          severity: code.severity,
          relatedComponents: code.commonCauses,
        };
      }
    }

    // Step 2: Preprocess query
    const queryTokens = preprocess(rawQuery);
    const queryTokensRaw = removeStopwords(tokenize(rawQuery));

    // Step 3: Vectorize query
    const queryVector = this.vectorizer.vectorize("query", queryTokens);

    // Step 4: Classify query
    const classification = this.classifier.classify(queryVector, rawQuery);

    // Step 5: Score all documents
    const scoredResults: {
      entry: KnowledgeEntry;
      cosineScore: number;
      bm25Score: number;
      jaccardScore: number;
      combinedScore: number;
      matchedKeywords: string[];
    }[] = [];

    const queryTokenSet = new Set(queryTokens);
    let maxBM25 = 0;

    // Score knowledge base entries
    for (const entry of KNOWLEDGE_BASE) {
      const docVector = this.docVectors.get(entry.id);
      const docTokens = this.docTokens.get(entry.id);
      if (!docVector || !docTokens) continue;

      const cosine = cosineSimilarity(queryVector, docVector);
      const bm25 = bm25Score(
        queryTokens,
        docTokens,
        (t) => this.vectorizer.getIDF(t),
        this.avgDocLength
      );
      const docTokenSet = new Set(docTokens);
      const jaccard = jaccardSimilarity(queryTokenSet, docTokenSet);

      if (bm25 > maxBM25) maxBM25 = bm25;

      // Find matched keywords
      const matchedKeywords = entry.keywords.filter((kw) => {
        const kwStems = preprocess(kw);
        return kwStems.some((s) => queryTokenSet.has(s));
      });

      scoredResults.push({
        entry,
        cosineScore: cosine,
        bm25Score: bm25,
        jaccardScore: jaccard,
        combinedScore: 0, // computed after we know maxBM25
        matchedKeywords,
      });
    }

    // Compute combined scores (need maxBM25 for normalization)
    for (const result of scoredResults) {
      result.combinedScore = computeCombinedScore(
        result.cosineScore,
        result.bm25Score,
        result.jaccardScore,
        maxBM25
      );
    }

    // Sort by combined score
    scoredResults.sort((a, b) => b.combinedScore - a.combinedScore);

    // Take top K
    const topResults = scoredResults.slice(0, topK);

    // Build match results
    const matches: MatchResult[] = topResults
      .filter((r) => r.combinedScore > 0.01)
      .map((r) => ({
        entry: r.entry,
        relevanceScore: r.combinedScore,
        similarityMethod: "cosine+bm25+jaccard",
        matchedKeywords: r.matchedKeywords,
        confidenceBand: r.combinedScore > 0.3 ? "high" : r.combinedScore > 0.15 ? "medium" : "low" as const,
      }));

    // If OBD code was found, insert it as the top match
    if (obdEntry) {
      matches.unshift({
        entry: obdEntry,
        relevanceScore: 1.0,
        similarityMethod: "exact_obd_match",
        matchedKeywords: [obdMatch![0]],
        confidenceBand: "high",
      });
    }

    // Step 6: Generate explanation
    const explanation = this.generateExplanation(
      rawQuery,
      queryTokens,
      queryTokensRaw,
      matches,
      classification,
      topResults[0]
    );

    const processingTimeMs = performance.now() - startTime;

    return {
      query: rawQuery,
      matches: matches.slice(0, topK),
      classification,
      explanation,
      processingTimeMs,
    };
  }

  /**
   * Generate a human-readable explanation of why results were produced.
   */
  private generateExplanation(
    rawQuery: string,
    queryStems: string[],
    queryTokensRaw: string[],
    matches: MatchResult[],
    classification: ReturnType<CategoryClassifier["classify"]>,
    topScored?: {
      cosineScore: number;
      bm25Score: number;
      jaccardScore: number;
      combinedScore: number;
    }
  ): ResultExplanation {
    const topMatch = matches[0];

    // Confidence reasoning
    let confidenceScore = 0;
    let confidenceReason = "";

    if (topMatch) {
      confidenceScore = topMatch.relevanceScore;
      if (topMatch.similarityMethod === "exact_obd_match") {
        confidenceScore = 0.98;
        confidenceReason = "Exact OBD-II code match found in database.";
      } else if (confidenceScore > 0.3) {
        confidenceReason = `Strong keyword and semantic overlap with '${topMatch.entry.title}'. ${topMatch.matchedKeywords.length} keywords matched directly.`;
      } else if (confidenceScore > 0.15) {
        confidenceReason = `Moderate similarity found. Some relevant terms overlap but query may be ambiguous.`;
      } else {
        confidenceReason = `Low confidence match. Query terms have limited overlap with knowledge base entries.`;
      }
    } else {
      confidenceReason = "No relevant matches found in the knowledge base for this query.";
    }

    // Why this result
    const whyThisResult: string[] = [];
    if (topMatch) {
      if (topMatch.matchedKeywords.length > 0) {
        whyThisResult.push(
          `Matched keywords: ${topMatch.matchedKeywords.join(", ")}`
        );
      }
      whyThisResult.push(
        `Query classified as '${classification.category}' with ${(classification.confidence * 100).toFixed(1)}% confidence`
      );
      whyThisResult.push(
        `Top result severity: ${topMatch.entry.severity}`
      );
    }

    // Similarity metrics breakdown
    const similarityMetrics = [];
    if (topScored) {
      similarityMetrics.push({
        method: "Cosine Similarity (TF-IDF)",
        score: topScored.cosineScore,
        formula: "cos(Q, D) = (Q · D) / (|Q| × |D|)",
      });
      similarityMetrics.push({
        method: "BM25 Score",
        score: topScored.bm25Score,
        formula: "Σ IDF(qi) × f(qi,D)×(k1+1) / (f(qi,D) + k1×(1-b+b×|D|/avgdl))",
      });
      similarityMetrics.push({
        method: "Jaccard Similarity",
        score: topScored.jaccardScore,
        formula: "J(A,B) = |A ∩ B| / |A ∪ B|",
      });
    }

    // Token overlap analysis
    const matchedTokens = topMatch
      ? queryStems.filter((t) => {
          const docTokens = this.docTokens.get(topMatch.entry.id);
          return docTokens?.includes(t);
        })
      : [];

    const overlapRatio =
      queryStems.length > 0 ? matchedTokens.length / queryStems.length : 0;

    return {
      summary: topMatch
        ? `Best match: "${topMatch.entry.title}" (${(topMatch.relevanceScore * 100).toFixed(1)}% relevance)`
        : "No relevant matches found.",
      whyThisResult,
      confidenceScore,
      confidenceReason,
      similarityMetrics,
      tokenOverlap: {
        queryTokens: queryTokensRaw,
        matchedTokens,
        overlapRatio,
      },
    };
  }

  /**
   * Get engine statistics for the Judge Mode page.
   */
  getStats() {
    return {
      knowledgeBaseSize: KNOWLEDGE_BASE.length,
      obdCodeCount: OBD_CODES.length,
      vocabularySize: this.vectorizer.getVocabularySize(),
      avgDocLength: this.avgDocLength,
      isInitialized: this.isInitialized,
    };
  }
}

// Singleton instance
let engineInstance: InferenceEngine | null = null;

export const getEngine = (): InferenceEngine => {
  if (!engineInstance) {
    engineInstance = new InferenceEngine();
    engineInstance.initialize();
  }
  return engineInstance;
};

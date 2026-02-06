/**
 * TF-IDF (Term Frequency – Inverse Document Frequency) Vectorizer
 * 
 * Implemented from scratch. No external libraries.
 * 
 * Mathematical Foundation:
 * ────────────────────────
 * 
 * TF(t, d) = (count of term t in document d) / (total terms in d)
 *   - Measures how frequently a term appears in a single document
 *   - Normalized by document length to prevent bias toward longer documents
 * 
 * IDF(t, D) = ln(N / (1 + df(t)))
 *   - N = total number of documents in corpus
 *   - df(t) = number of documents containing term t
 *   - The +1 prevents division by zero (Laplace smoothing)
 *   - ln (natural log) used for smoother scaling
 *   - Terms appearing in many documents get lower weight
 *   - Rare, distinctive terms get higher weight
 * 
 * TF-IDF(t, d, D) = TF(t, d) × IDF(t, D)
 *   - Combines term frequency with rarity
 *   - High TF-IDF = term is frequent in this document AND rare across corpus
 *   - This is exactly what makes it useful for finding relevant documents
 * 
 * Why TF-IDF for automotive diagnostics?
 * ───────────────────────────────────────
 * - Domain-specific terms (e.g., "misfire", "catalytic") are naturally rare 
 *   in general text → high IDF → strong signal
 * - Common words ("car", "engine") appear in many entries → low IDF → reduced noise
 * - No training data needed — works on the corpus directly
 */

import { TFIDFVector } from "../types";

export class TFIDFVectorizer {
  private idfCache: Map<string, number> = new Map();
  private vocabulary: Set<string> = new Set();
  private corpusSize: number = 0;
  private documentFrequency: Map<string, number> = new Map();
  private isBuilt: boolean = false;

  /**
   * Build the IDF index from a corpus of documents.
   * Must be called before vectorizing queries.
   * 
   * @param documents - Array of [docId, stemmedTokens] pairs
   */
  buildIndex(documents: [string, string[]][]): void {
    this.corpusSize = documents.length;
    this.documentFrequency.clear();
    this.vocabulary.clear();

    // Count document frequency for each term
    for (const [, tokens] of documents) {
      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        this.vocabulary.add(term);
        this.documentFrequency.set(
          term,
          (this.documentFrequency.get(term) || 0) + 1
        );
      }
    }

    // Pre-compute IDF values
    // IDF(t) = ln(N / (1 + df(t)))
    for (const [term, df] of this.documentFrequency) {
      const idf = Math.log(this.corpusSize / (1 + df));
      this.idfCache.set(term, idf);
    }

    this.isBuilt = true;
  }

  /**
   * Vectorize a document/query into a TF-IDF vector.
   * 
   * @param docId - Document identifier
   * @param tokens - Preprocessed (stemmed) tokens
   * @returns TFIDFVector with sparse vector representation
   */
  vectorize(docId: string, tokens: string[]): TFIDFVector {
    if (!this.isBuilt) {
      throw new Error("TFIDFVectorizer: must call buildIndex() first");
    }

    const termCounts = new Map<string, number>();
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) || 0) + 1);
    }

    const vector = new Map<string, number>();
    let magnitudeSquared = 0;

    for (const [term, count] of termCounts) {
      // TF = count / total tokens in document
      const tf = count / tokens.length;
      
      // IDF from cache (0 for unknown terms)
      const idf = this.idfCache.get(term) || 0;
      
      // TF-IDF = TF × IDF
      const tfidf = tf * idf;

      if (tfidf > 0) {
        vector.set(term, tfidf);
        magnitudeSquared += tfidf * tfidf;
      }
    }

    return {
      docId,
      vector,
      magnitude: Math.sqrt(magnitudeSquared),
    };
  }

  /**
   * Get the IDF value for a specific term.
   * Useful for explaining why certain terms are weighted higher.
   */
  getIDF(term: string): number {
    return this.idfCache.get(term) || 0;
  }

  /**
   * Get vocabulary size (number of unique terms in corpus)
   */
  getVocabularySize(): number {
    return this.vocabulary.size;
  }

  /**
   * Get the document frequency for a term
   */
  getDocumentFrequency(term: string): number {
    return this.documentFrequency.get(term) || 0;
  }

  /**
   * Get the top-N terms by IDF value (most distinctive terms in corpus)
   */
  getTopTermsByIDF(n: number): { term: string; idf: number }[] {
    return Array.from(this.idfCache.entries())
      .map(([term, idf]) => ({ term, idf }))
      .sort((a, b) => b.idf - a.idf)
      .slice(0, n);
  }
}

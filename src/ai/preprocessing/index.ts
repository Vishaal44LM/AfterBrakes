/**
 * NLP Preprocessing Pipeline
 * 
 * Implements from scratch:
 * 1. Tokenization (automotive-aware)
 * 2. Stopword removal
 * 3. Porter Stemmer (simplified, English)
 * 4. N-gram generation
 * 
 * No external NLP libraries used.
 */

import { TokenizedDocument } from "../types";

// ─── Stopwords ───
// Common English stopwords that don't contribute to meaning
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "don", "now", "and", "but", "or", "if", "while", "about", "up",
  "it", "its", "it's", "i", "me", "my", "we", "our", "you", "your",
  "he", "him", "his", "she", "her", "they", "them", "their", "this",
  "that", "these", "those", "what", "which", "who", "whom",
]);

// ─── Automotive-specific compound terms to preserve ───
const COMPOUND_TERMS: Record<string, string> = {
  "check engine": "check_engine",
  "oil change": "oil_change",
  "brake pad": "brake_pad",
  "spark plug": "spark_plug",
  "timing belt": "timing_belt",
  "timing chain": "timing_chain",
  "head gasket": "head_gasket",
  "water pump": "water_pump",
  "fuel pump": "fuel_pump",
  "fuel filter": "fuel_filter",
  "air filter": "air_filter",
  "oil filter": "oil_filter",
  "power steering": "power_steering",
  "wheel bearing": "wheel_bearing",
  "cv joint": "cv_joint",
  "ball joint": "ball_joint",
  "control arm": "control_arm",
  "sway bar": "sway_bar",
  "catalytic converter": "catalytic_converter",
  "o2 sensor": "o2_sensor",
  "oxygen sensor": "oxygen_sensor",
  "maf sensor": "maf_sensor",
  "abs light": "abs_light",
  "abs sensor": "abs_sensor",
  "wheel speed": "wheel_speed",
  "fuel economy": "fuel_economy",
  "fuel efficiency": "fuel_efficiency",
  "oil pressure": "oil_pressure",
  "idle speed": "idle_speed",
  "exhaust gas": "exhaust_gas",
  "tire pressure": "tire_pressure",
  "white smoke": "white_smoke",
  "blue smoke": "blue_smoke",
  "black smoke": "black_smoke",
};

/**
 * Replace compound automotive terms with single tokens
 * This preserves domain-specific meaning during tokenization.
 */
const replaceCompoundTerms = (text: string): string => {
  let result = text.toLowerCase();
  for (const [phrase, token] of Object.entries(COMPOUND_TERMS)) {
    result = result.split(phrase).join(token);
  }
  return result;
};

/**
 * Tokenize text into individual terms.
 * Handles: punctuation removal, lowercasing, automotive compound terms.
 */
export const tokenize = (text: string): string[] => {
  // Preserve OBD codes (P0420, C0035, etc.)
  const processed = replaceCompoundTerms(text);
  
  // Split on whitespace and non-alphanumeric (keep underscores for compounds)
  const tokens = processed
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  return tokens;
};

/**
 * Remove stopwords from a token array.
 */
export const removeStopwords = (tokens: string[]): string[] => {
  return tokens.filter((t) => !STOPWORDS.has(t));
};

/**
 * Simplified Porter Stemmer
 * 
 * Applies the most impactful suffix-stripping rules:
 * Step 1: Plurals and -ed/-ing endings
 * Step 2: Common derivational suffixes
 * 
 * This covers ~80% of English morphological variation
 * without the complexity of the full Porter algorithm.
 */
export const stem = (word: string): string => {
  // Don't stem very short words or compound terms
  if (word.length <= 3 || word.includes("_")) return word;

  let w = word;

  // Step 1a: Plurals
  if (w.endsWith("sses")) w = w.slice(0, -2);
  else if (w.endsWith("ies")) w = w.slice(0, -3) + "i";
  else if (w.endsWith("ss")) { /* keep */ }
  else if (w.endsWith("s") && w.length > 3) w = w.slice(0, -1);

  // Step 1b: -ed, -ing
  if (w.endsWith("eed")) {
    if (w.length > 4) w = w.slice(0, -1); // agreed → agree
  } else if (w.endsWith("ed") && w.length > 4) {
    w = w.slice(0, -2);
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
  } else if (w.endsWith("ing") && w.length > 5) {
    w = w.slice(0, -3);
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) w += "e";
  }

  // Step 2: Common suffixes
  if (w.endsWith("ational")) w = w.slice(0, -7) + "ate";
  else if (w.endsWith("tional")) w = w.slice(0, -6) + "tion";
  else if (w.endsWith("ation")) w = w.slice(0, -5) + "ate";
  else if (w.endsWith("ness")) w = w.slice(0, -4);
  else if (w.endsWith("ment")) w = w.slice(0, -4);
  else if (w.endsWith("ment")) w = w.slice(0, -4);
  else if (w.endsWith("able")) w = w.slice(0, -4);
  else if (w.endsWith("ible")) w = w.slice(0, -4);
  else if (w.endsWith("ful")) w = w.slice(0, -3);
  else if (w.endsWith("ous")) w = w.slice(0, -3);
  else if (w.endsWith("ive")) w = w.slice(0, -3);
  else if (w.endsWith("ly")) w = w.slice(0, -2);

  return w.length >= 2 ? w : word;
};

/**
 * Full preprocessing pipeline:
 * raw text → tokenize → remove stopwords → stem
 */
export const preprocess = (text: string): string[] => {
  const tokens = tokenize(text);
  const filtered = removeStopwords(tokens);
  const stemmed = filtered.map(stem);
  return stemmed;
};

/**
 * Create a TokenizedDocument from raw text
 */
export const createTokenizedDocument = (
  id: string,
  text: string
): TokenizedDocument => {
  const tokens = tokenize(text);
  const filtered = removeStopwords(tokens);
  const stems = filtered.map(stem);

  return {
    id,
    originalText: text,
    tokens: filtered,
    stems,
  };
};

/**
 * Generate n-grams from tokens
 * Used for phrase-level matching
 */
export const generateNgrams = (tokens: string[], n: number): string[] => {
  if (tokens.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
};

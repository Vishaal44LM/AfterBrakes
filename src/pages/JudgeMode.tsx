import { useState, useEffect, useMemo, useCallback } from "react";
import { ArrowLeft, Search, Cpu, Database, Layers, BarChart3, FlaskConical, Lightbulb, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { getEngine } from "@/ai/inference/engine";
import { runEvaluation } from "@/ai/evaluation/evaluator";
import { InferenceResult, EvaluationSummary, Severity } from "@/ai/types";

const SEVERITY_COLORS: Record<Severity, string> = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const JudgeMode = () => {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [queryInput, setQueryInput] = useState("");
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationSummary | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const engine = useMemo(() => getEngine(), []);
  const stats = useMemo(() => engine.getStats(), [engine]);

  const handleQuery = useCallback(() => {
    if (!queryInput.trim()) return;
    const result = engine.query(queryInput.trim());
    setInferenceResult(result);
  }, [queryInput, engine]);

  const handleRunEval = useCallback(() => {
    setIsEvaluating(true);
    // Use setTimeout to let the UI update
    setTimeout(() => {
      const result = runEvaluation(engine);
      setEvaluationResult(result);
      setIsEvaluating(false);
    }, 50);
  }, [engine]);

  const sections = [
    { id: "overview", label: "Overview", icon: Lightbulb },
    { id: "architecture", label: "Architecture", icon: Layers },
    { id: "live-demo", label: "Live Demo", icon: Search },
    { id: "evaluation", label: "Evaluation", icon: BarChart3 },
    { id: "data", label: "Data Layer", icon: Database },
    { id: "model", label: "Model Layer", icon: Cpu },
  ];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
        <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Judge Mode</h1>
        </div>
        <span className="text-xs text-muted-foreground/50 ml-2">AI Transparency Dashboard</span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-border/10 overflow-x-auto">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeSection === id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* ═══ OVERVIEW ═══ */}
          {activeSection === "overview" && (
            <div className="space-y-6 animate-fade-slide-up">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">What Problem Is Being Solved?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most "AI-powered" automotive apps are thin wrappers around GPT/Claude APIs. They send your question to a remote LLM, receive a generic response, and provide zero transparency about <em>why</em> they gave that answer or <em>how confident</em> they are.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After Brakes takes a fundamentally different approach: <strong>a custom NLP engine that runs entirely client-side</strong>, using curated automotive knowledge, mathematical similarity scoring, and explainable inference — no external LLM calls needed for core diagnostic reasoning.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card/50 border border-border/20">
                  <h3 className="text-sm font-semibold text-foreground mb-2">🔴 Typical "AI" Car App</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Sends everything to GPT API</li>
                    <li>• No control over responses</li>
                    <li>• Zero explainability</li>
                    <li>• Hallucinations with no warning</li>
                    <li>• Requires internet + API key</li>
                    <li>• Cannot explain confidence level</li>
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <h3 className="text-sm font-semibold text-primary mb-2">🟢 After Brakes Engine</h3>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>• Custom TF-IDF + BM25 + Jaccard pipeline</li>
                    <li>• Curated domain-specific knowledge base</li>
                    <li>• Every result has confidence scores</li>
                    <li>• Token overlap analysis visible</li>
                    <li>• Runs 100% client-side, no API calls</li>
                    <li>• Mathematical similarity — no black box</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                <h3 className="text-sm font-semibold text-foreground mb-2">What Is Trained vs Inferred?</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <span className="text-primary font-medium">Pre-computed (at init):</span>
                    <ul className="mt-1 space-y-1">
                      <li>• TF-IDF inverse document frequencies</li>
                      <li>• Category centroid vectors</li>
                      <li>• Vocabulary index ({stats.vocabularySize} terms)</li>
                    </ul>
                  </div>
                  <div>
                    <span className="text-primary font-medium">Inferred (at query time):</span>
                    <ul className="mt-1 space-y-1">
                      <li>• Query vectorization</li>
                      <li>• Cosine + BM25 + Jaccard scoring</li>
                      <li>• Category classification</li>
                      <li>• Confidence & explanation generation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                <h3 className="text-sm font-semibold text-foreground mb-3">Engine Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="KB Entries" value={stats.knowledgeBaseSize} />
                  <StatCard label="OBD Codes" value={stats.obdCodeCount} />
                  <StatCard label="Vocabulary" value={stats.vocabularySize} />
                  <StatCard label="Avg Doc Len" value={Math.round(stats.avgDocLength)} />
                </div>
              </div>
            </div>
          )}

          {/* ═══ ARCHITECTURE ═══ */}
          {activeSection === "architecture" && (
            <div className="space-y-6 animate-fade-slide-up">
              <h2 className="text-xl font-bold text-foreground">System Architecture</h2>
              <p className="text-sm text-muted-foreground">
                Four clearly separated layers, each independently testable and replaceable.
              </p>

              <div className="space-y-3">
                <LayerCard
                  icon="📦"
                  title="Data Layer"
                  path="src/ai/data/"
                  description="Curated automotive knowledge base with OBD-II codes, diagnostic patterns, maintenance guides, component info, complaints, and FAQs. Each entry has structured metadata: severity, keywords, related components."
                  files={["automotive-kb.ts (30+ entries)", "obd-codes.ts (30+ codes)"]}
                />
                <LayerCard
                  icon="⚙️"
                  title="Preprocessing Layer"
                  path="src/ai/preprocessing/"
                  description="NLP pipeline: automotive-aware tokenizer (preserves compound terms like 'spark_plug'), stopword removal, simplified Porter stemmer. No external NLP libraries."
                  files={["index.ts (tokenize, stem, preprocess)"]}
                />
                <LayerCard
                  icon="🧮"
                  title="Model Layer"
                  path="src/ai/model/"
                  description="TF-IDF vectorizer, cosine similarity, BM25 ranking, Jaccard similarity, and Rocchio centroid-based category classifier. All implemented from scratch with mathematical formulas documented."
                  files={["tfidf.ts", "similarity.ts", "classifier.ts"]}
                />
                <LayerCard
                  icon="🧠"
                  title="Inference Layer"
                  path="src/ai/inference/"
                  description="Orchestrates the pipeline: preprocess → vectorize → classify → score → rank → explain. Generates confidence scores, similarity breakdowns, and token overlap analysis."
                  files={["engine.ts (InferenceEngine class)"]}
                />
              </div>

              <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                <h3 className="text-sm font-semibold text-foreground mb-2">Pipeline Flow</h3>
                <div className="font-mono text-xs text-muted-foreground leading-loose">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">User Query</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">OBD Detect</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Tokenize</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Stopwords</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Stem</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">TF-IDF Vec</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Classify</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Score All</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-secondary/30">Rank</span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">Explained Result</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LIVE DEMO ═══ */}
          {activeSection === "live-demo" && (
            <div className="space-y-6 animate-fade-slide-up">
              <h2 className="text-xl font-bold text-foreground">Live Inference Demo</h2>
              <p className="text-sm text-muted-foreground">
                Type any automotive question and see the full inference pipeline with explainability.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                  placeholder="e.g., 'my car is overheating' or 'P0420'"
                  className="flex-1 px-4 py-3 rounded-xl bg-card border border-border/30 text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleQuery}
                  className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Quick examples */}
              <div className="flex flex-wrap gap-2">
                {[
                  "my car is overheating",
                  "P0420",
                  "when to change oil",
                  "brake pedal feels soft",
                  "what does a turbo do",
                  "battery dies overnight",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQueryInput(q);
                      const result = engine.query(q);
                      setInferenceResult(result);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-secondary/20 text-xs text-muted-foreground hover:bg-secondary/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {inferenceResult && (
                <div className="space-y-4">
                  {/* Processing stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>⚡ {inferenceResult.processingTimeMs.toFixed(1)}ms</span>
                    <span>📊 {inferenceResult.matches.length} matches</span>
                    <span>🏷️ {inferenceResult.classification.category}</span>
                    <span>🎯 {(inferenceResult.classification.confidence * 100).toFixed(0)}% confidence</span>
                  </div>

                  {/* Explanation */}
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                    <h3 className="text-sm font-semibold text-primary mb-2">Explainability Report</h3>
                    <p className="text-sm text-foreground mb-2">{inferenceResult.explanation.summary}</p>
                    <p className="text-xs text-muted-foreground mb-3">{inferenceResult.explanation.confidenceReason}</p>
                    
                    <div className="space-y-2">
                      {inferenceResult.explanation.whyThisResult.map((reason, i) => (
                        <div key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Similarity Metrics */}
                  {inferenceResult.explanation.similarityMetrics.length > 0 && (
                    <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Similarity Metrics</h3>
                      <div className="space-y-2">
                        {inferenceResult.explanation.similarityMetrics.map((metric, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{metric.method}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${Math.min(metric.score * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-foreground font-mono w-12 text-right">
                                {metric.score.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/10">
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          {inferenceResult.explanation.similarityMetrics[0]?.formula}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Token Overlap */}
                  <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Token Analysis</h3>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {inferenceResult.explanation.tokenOverlap.queryTokens.map((t, i) => {
                        const isMatched = inferenceResult.explanation.tokenOverlap.matchedTokens.includes(t);
                        return (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-xs ${
                              isMatched
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-secondary/20 text-muted-foreground"
                            }`}
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Overlap ratio: {(inferenceResult.explanation.tokenOverlap.overlapRatio * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Top Matches */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Ranked Results</h3>
                    {inferenceResult.matches.map((match, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-card/40 border border-border/20"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            #{i + 1} {match.entry.title}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            match.confidenceBand === "high" ? "bg-green-500/10 text-green-400" :
                            match.confidenceBand === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>
                            {(match.relevanceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {match.entry.content}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] ${SEVERITY_COLORS[match.entry.severity]}`}>
                            {match.entry.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">•</span>
                          <span className="text-[10px] text-muted-foreground/50">{match.entry.category}</span>
                          {match.matchedKeywords.length > 0 && (
                            <>
                              <span className="text-[10px] text-muted-foreground/50">•</span>
                              <span className="text-[10px] text-primary/60">
                                keywords: {match.matchedKeywords.join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ EVALUATION ═══ */}
          {activeSection === "evaluation" && (
            <div className="space-y-6 animate-fade-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Evaluation Suite</h2>
                <button
                  onClick={handleRunEval}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isEvaluating ? "Running..." : "Run All Tests"}
                </button>
              </div>

              {evaluationResult && (
                <>
                  {/* Summary metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      label="Accuracy"
                      value={`${(evaluationResult.accuracy * 100).toFixed(0)}%`}
                      sub={`${evaluationResult.passed}/${evaluationResult.totalTests} passed`}
                    />
                    <MetricCard
                      label="Avg Precision"
                      value={`${(evaluationResult.avgPrecision * 100).toFixed(0)}%`}
                      sub="Relevant in results"
                    />
                    <MetricCard
                      label="Avg Recall"
                      value={`${(evaluationResult.avgRecall * 100).toFixed(0)}%`}
                      sub="Expected found"
                    />
                    <MetricCard
                      label="Avg F1 Score"
                      value={`${(evaluationResult.avgF1 * 100).toFixed(0)}%`}
                      sub="Harmonic mean"
                    />
                  </div>

                  {/* Test results */}
                  <div className="space-y-2">
                    {evaluationResult.results.map((result) => (
                      <div
                        key={result.testCaseId}
                        className="rounded-xl bg-card/30 border border-border/10 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedTest(
                              expandedTest === result.testCaseId ? null : result.testCaseId
                            )
                          }
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                        >
                          {result.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span className="text-xs font-mono text-muted-foreground/50 w-16 flex-shrink-0">
                            {result.testCaseId}
                          </span>
                          <span className="text-xs text-foreground flex-1 truncate">
                            {result.details}
                          </span>
                          {expandedTest === result.testCaseId ? (
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </button>
                        {expandedTest === result.testCaseId && (
                          <div className="px-3 pb-3 text-xs text-muted-foreground space-y-1 border-t border-border/10 pt-2">
                            <div>Expected category: <span className="text-foreground">{result.expectedCategory}</span></div>
                            <div>Actual category: <span className={result.categoryCorrect ? "text-green-400" : "text-red-400"}>{result.actualCategory}</span></div>
                            <div>Precision: {(result.matchPrecision * 100).toFixed(0)}% | Recall: {(result.matchRecall * 100).toFixed(0)}% | F1: {(result.f1Score * 100).toFixed(0)}%</div>
                            <div>Expected IDs: [{result.expectedMatchIds.join(", ")}]</div>
                            <div>Actual IDs: [{result.actualMatchIds.slice(0, 5).join(", ")}]</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!evaluationResult && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Click "Run All Tests" to execute 24 test cases against the AI engine.
                </div>
              )}
            </div>
          )}

          {/* ═══ DATA LAYER ═══ */}
          {activeSection === "data" && (
            <div className="space-y-6 animate-fade-slide-up">
              <h2 className="text-xl font-bold text-foreground">Data Layer</h2>
              <p className="text-sm text-muted-foreground">
                All data is curated manually — no scraping, no generated content. Every entry has been reviewed for accuracy and tagged with severity, keywords, and related components.
              </p>

              <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                <h3 className="text-sm font-semibold text-foreground mb-3">Dataset Coverage</h3>
                <div className="space-y-2">
                  {[
                    { name: "Diagnostic Patterns", count: stats.knowledgeBaseSize, desc: "Symptom → cause mappings with severity" },
                    { name: "OBD-II Codes", count: stats.obdCodeCount, desc: "P/B/C codes with causes, symptoms, costs" },
                    { name: "Maintenance Guides", count: 6, desc: "Service intervals and procedures" },
                    { name: "Component Info", count: 4, desc: "Part functions and failure modes" },
                    { name: "Vehicle Complaints", count: 3, desc: "Common reported issues" },
                    { name: "FAQs", count: 6, desc: "Frequently asked questions" },
                  ].map((ds) => (
                    <div key={ds.name} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-foreground">{ds.name}</span>
                        <span className="text-muted-foreground/50 ml-2">— {ds.desc}</span>
                      </div>
                      <span className="text-primary font-mono">{ds.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
                <h3 className="text-sm font-semibold text-foreground mb-2">Entry Schema</h3>
                <pre className="text-xs text-muted-foreground font-mono bg-secondary/10 p-3 rounded-lg overflow-x-auto">
{`{
  id: "diag-001",
  category: "diagnostic_pattern",
  title: "Engine overheating while driving",
  content: "Engine overheating is indicated by...",
  keywords: ["overheating", "temperature", ...],
  severity: "critical",
  relatedComponents: ["radiator", "thermostat", ...]
}`}
                </pre>
              </div>
            </div>
          )}

          {/* ═══ MODEL LAYER ═══ */}
          {activeSection === "model" && (
            <div className="space-y-6 animate-fade-slide-up">
              <h2 className="text-xl font-bold text-foreground">Model Layer</h2>

              <div className="space-y-4">
                <FormulaCard
                  title="TF-IDF Vectorization"
                  formula="TF-IDF(t, d, D) = TF(t, d) × IDF(t, D)"
                  explanation={[
                    "TF(t, d) = count(t in d) / |d| — How frequent is this term in this document?",
                    "IDF(t, D) = ln(N / (1 + df(t))) — How rare is this term across all documents?",
                    "High TF-IDF = term is frequent here AND rare globally → strong signal",
                  ]}
                />
                <FormulaCard
                  title="Cosine Similarity"
                  formula="cos(A, B) = (A · B) / (|A| × |B|)"
                  explanation={[
                    "Dot product of TF-IDF vectors divided by their magnitudes",
                    "Range [0, 1]: 0 = no overlap, 1 = identical term distribution",
                    "Length-independent: short queries can match long documents",
                  ]}
                />
                <FormulaCard
                  title="BM25 Ranking"
                  formula="score = Σ IDF(qi) × f(qi,D)×(k1+1) / (f(qi,D) + k1×(1-b+b×|D|/avgdl))"
                  explanation={[
                    "k1=1.5 controls term frequency saturation (diminishing returns)",
                    "b=0.75 controls document length normalization",
                    "Better than raw TF-IDF for ranking when doc lengths vary",
                  ]}
                />
                <FormulaCard
                  title="Jaccard Similarity"
                  formula="J(A, B) = |A ∩ B| / |A ∪ B|"
                  explanation={[
                    "Simple set overlap: what fraction of terms are shared?",
                    "Ignores frequency — pure presence/absence",
                    "Acts as safety net for obvious keyword matches",
                  ]}
                />
                <FormulaCard
                  title="Score Fusion"
                  formula="combined = 0.45×cosine + 0.40×norm(BM25) + 0.15×jaccard"
                  explanation={[
                    "Cosine (45%): primary semantic match signal",
                    "BM25 (40%): robust ranking with length normalization",
                    "Jaccard (15%): keyword overlap baseline",
                  ]}
                />
                <FormulaCard
                  title="Category Classification"
                  formula="class = argmax_c cos(query_vec, centroid_c) + indicator_boost"
                  explanation={[
                    "Rocchio nearest-centroid: each category has an average TF-IDF vector",
                    "Query is assigned to category with highest cosine similarity",
                    "Keyword indicators provide +8% boost per match (capped at 30%)",
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="p-3 rounded-xl bg-card/40 border border-border/20 text-center">
    <div className="text-lg font-bold text-primary">{value}</div>
    <div className="text-[10px] text-muted-foreground">{label}</div>
  </div>
);

const MetricCard = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="p-3 rounded-xl bg-card/40 border border-border/20 text-center">
    <div className="text-lg font-bold text-foreground">{value}</div>
    <div className="text-xs text-foreground font-medium">{label}</div>
    <div className="text-[10px] text-muted-foreground">{sub}</div>
  </div>
);

const LayerCard = ({
  icon,
  title,
  path,
  description,
  files,
}: {
  icon: string;
  title: string;
  path: string;
  description: string;
  files: string[];
}) => (
  <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-lg">{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <span className="text-[10px] text-muted-foreground/40 font-mono">{path}</span>
    </div>
    <p className="text-xs text-muted-foreground mb-2">{description}</p>
    <div className="flex flex-wrap gap-1">
      {files.map((f) => (
        <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-secondary/20 text-muted-foreground/60 font-mono">
          {f}
        </span>
      ))}
    </div>
  </div>
);

const FormulaCard = ({
  title,
  formula,
  explanation,
}: {
  title: string;
  formula: string;
  explanation: string[];
}) => (
  <div className="p-4 rounded-2xl bg-card/30 border border-border/10">
    <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
    <div className="px-3 py-2 rounded-lg bg-secondary/10 font-mono text-xs text-primary mb-3">
      {formula}
    </div>
    <div className="space-y-1">
      {explanation.map((e, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {e}
        </p>
      ))}
    </div>
  </div>
);

export default JudgeMode;

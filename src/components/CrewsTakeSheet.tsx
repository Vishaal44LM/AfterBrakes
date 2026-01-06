import { useState, useEffect, useMemo } from "react";
import { X, Copy, Share2, Check, Sparkles, Lightbulb, ArrowRight, MessageSquare, AlertTriangle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CrewsTakeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  hasUpdates?: boolean;
}

// Clean markdown from text
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\*/g, "")
    .trim();
};

const CrewsTakeSheet = ({ isOpen, onClose, messages, hasUpdates }: CrewsTakeSheetProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Comprehensive summary generation
  const summary = useMemo(() => {
    if (!isOpen || messages.length === 0) {
      return { 
        mainTopic: "", 
        diagnosis: "",
        keyPoints: [], 
        actionItems: [], 
        importantWarnings: [],
        partsMentioned: []
      };
    }

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // Get ALL user questions for context
    const allUserQuestions = userMessages.map(m => cleanMarkdown(m.content)).slice(0, 3);
    const mainTopic = allUserQuestions[0] || "";

    // Combine all assistant content for analysis
    const fullAssistantContent = assistantMessages.map(m => cleanMarkdown(m.content)).join(" ");
    
    const keyPoints: string[] = [];
    const actionItems: string[] = [];
    const importantWarnings: string[] = [];
    const partsMentioned: string[] = [];

    // Extract parts/components mentioned
    const partsRegex = /\b(brake pads?|rotors?|calipers?|battery|alternator|starter|spark plugs?|oil filter|air filter|coolant|transmission|clutch|tie rods?|ball joints?|cv joints?|axle|bearings?|struts?|shocks?|serpentine belt|timing belt|water pump|fuel pump|radiator|thermostat|oxygen sensor|catalytic converter|muffler|exhaust)\b/gi;
    const partsMatches = fullAssistantContent.match(partsRegex);
    if (partsMatches) {
      const uniqueParts = [...new Set(partsMatches.map(p => p.toLowerCase()))];
      partsMentioned.push(...uniqueParts.slice(0, 5));
    }

    // Process each assistant message thoroughly
    assistantMessages.forEach((msg) => {
      const content = cleanMarkdown(msg.content);
      const sentences = content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter((s) => s.length > 10 && s.length < 200);

      sentences.forEach((sentence) => {
        const lower = sentence.toLowerCase();
        
        // Critical warnings (highest priority)
        if (lower.includes("don't drive") || lower.includes("stop driving") || 
            lower.includes("immediately") || lower.includes("dangerous") ||
            lower.includes("safety issue") || lower.includes("unsafe")) {
          if (importantWarnings.length < 3 && !importantWarnings.some(w => w.toLowerCase().includes(sentence.toLowerCase().slice(0, 25)))) {
            importantWarnings.push(sentence);
          }
        }
        // Warnings/cautions
        else if (lower.includes("warning") || lower.includes("caution") || 
                 lower.includes("important") || lower.includes("attention") ||
                 lower.includes("avoid") || lower.includes("risk")) {
          if (importantWarnings.length < 3 && !importantWarnings.some(w => w.toLowerCase().includes(sentence.toLowerCase().slice(0, 25)))) {
            importantWarnings.push(sentence);
          }
        }
        // Action items - things to do
        else if (lower.includes("should") || lower.includes("recommend") || 
                 lower.includes("need to") || lower.includes("suggest") ||
                 lower.includes("consider") || lower.includes("might want to") ||
                 lower.includes("check") || lower.includes("inspect") ||
                 lower.includes("replace") || lower.includes("visit") ||
                 lower.includes("take it to") || lower.includes("get it")) {
          if (actionItems.length < 5 && !actionItems.some(a => a.toLowerCase().includes(sentence.toLowerCase().slice(0, 25)))) {
            actionItems.push(sentence);
          }
        }
        // Key insights - explanations
        else if (lower.includes("because") || lower.includes("caused by") || 
                 lower.includes("likely") || lower.includes("probably") ||
                 lower.includes("usually") || lower.includes("common") || 
                 lower.includes("means") || lower.includes("indicates") ||
                 lower.includes("symptom of") || lower.includes("sign of") ||
                 lower.includes("could be") || lower.includes("might be")) {
          if (keyPoints.length < 4 && !keyPoints.some(k => k.toLowerCase().includes(sentence.toLowerCase().slice(0, 25)))) {
            keyPoints.push(sentence);
          }
        }
      });
    });

    // Build a diagnosis summary from the first substantial assistant response
    let diagnosis = "";
    if (assistantMessages.length > 0) {
      const firstResponse = cleanMarkdown(assistantMessages[0].content);
      const firstSentences = firstResponse.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 2);
      diagnosis = firstSentences.join(". ").trim();
      if (diagnosis && !diagnosis.endsWith(".")) diagnosis += ".";
    }

    // Ensure we have action items
    if (actionItems.length === 0 && assistantMessages.length > 0) {
      actionItems.push("Review the conversation for specific guidance");
      if (partsMentioned.length > 0) {
        actionItems.push(`Check the ${partsMentioned.slice(0, 2).join(" and ")} as mentioned`);
      }
    }

    // Ensure we have key points
    if (keyPoints.length === 0 && diagnosis) {
      keyPoints.push(diagnosis);
    }

    return { mainTopic, diagnosis, keyPoints, actionItems, importantWarnings, partsMentioned };
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const generateTextSummary = () => {
    let text = "🔧 CREW'S TAKE - Your Chat Summary\n";
    text += "═".repeat(40) + "\n\n";

    text += "📋 YOUR QUESTION:\n";
    text += `${summary.mainTopic}\n\n`;

    if (summary.diagnosis) {
      text += "🔍 QUICK DIAGNOSIS:\n";
      text += `${summary.diagnosis}\n\n`;
    }

    if (summary.importantWarnings.length > 0) {
      text += "⚠️ IMPORTANT WARNINGS:\n";
      summary.importantWarnings.forEach((w) => {
        text += `• ${w}\n`;
      });
      text += "\n";
    }

    if (summary.keyPoints.length > 0) {
      text += "💡 KEY INSIGHTS:\n";
      summary.keyPoints.forEach((p) => {
        text += `• ${p}\n`;
      });
      text += "\n";
    }

    if (summary.partsMentioned.length > 0) {
      text += "🔩 PARTS MENTIONED:\n";
      text += `${summary.partsMentioned.join(", ")}\n\n`;
    }

    text += "✅ RECOMMENDED ACTIONS:\n";
    summary.actionItems.forEach((item, i) => {
      text += `${i + 1}. ${item}\n`;
    });

    text += "\n─".repeat(20);
    text += "\nGenerated by After Brakes";

    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateTextSummary());
    setCopied(true);
    toast({ title: "Summary copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Crew's Take - After Brakes",
          text: generateTextSummary(),
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-xl animate-action-sheet-up max-h-[90vh] flex flex-col"
        style={{
          boxShadow: "0 -10px 40px hsl(0 0% 0% / 0.5), var(--shadow-glow)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Crew's Take</h3>
              <p className="text-xs text-muted-foreground">Complete summary of your conversation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-secondary/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Your Question */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Your question</h4>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {summary.mainTopic || "No question yet"}
            </p>
          </div>

          {/* Quick Diagnosis */}
          {summary.diagnosis && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-medium text-foreground">Quick diagnosis</h4>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {summary.diagnosis}
              </p>
            </div>
          )}

          {/* Important Warnings */}
          {summary.importantWarnings.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Important warnings
              </h4>
              <ul className="space-y-2">
                {summary.importantWarnings.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-destructive/90">
                    <span className="shrink-0 mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Insights */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Key insights
              </h4>
              <ul className="space-y-2">
                {summary.keyPoints.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 bg-secondary/20 rounded-lg p-3">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parts Mentioned */}
          {summary.partsMentioned.length > 0 && (
            <div className="bg-secondary/20 rounded-xl p-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Parts mentioned</h4>
              <div className="flex flex-wrap gap-2">
                {summary.partsMentioned.map((part, i) => (
                  <span 
                    key={i} 
                    className="px-2 py-1 text-xs bg-secondary/50 rounded-full text-foreground/70 capitalize"
                  >
                    {part}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              Recommended actions
            </h4>
            <ol className="space-y-2">
              {summary.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <span className="text-primary font-semibold shrink-0 bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border/20 bg-card">
          <Button onClick={handleCopy} className="flex-1 btn-glow">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy summary"}
          </Button>
          <Button onClick={handleShare} variant="ghost" className="px-4 hover:bg-secondary/50">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrewsTakeSheet;

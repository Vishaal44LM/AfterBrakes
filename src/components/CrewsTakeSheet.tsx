import { useState, useEffect, useMemo } from "react";
import { X, Copy, Share2, Check, Sparkles, Lightbulb, ArrowRight, MessageSquare } from "lucide-react";
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

  // Memoize summary generation for performance
  const summary = useMemo(() => {
    if (!isOpen || messages.length === 0) return { mainTopic: "", keyPoints: [], actionItems: [], importantWarnings: [] };

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // Extract main topic from first user message
    const firstUserMsg = userMessages[0]?.content || "";
    const mainTopic = firstUserMsg.length > 100 ? firstUserMsg.slice(0, 100) + "..." : firstUserMsg;

    // Extract key points from assistant responses
    const keyPoints: string[] = [];
    const actionItems: string[] = [];
    const importantWarnings: string[] = [];

    assistantMessages.forEach((msg) => {
      const content = msg.content;
      const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 15);

      sentences.forEach((sentence) => {
        const clean = sentence.replace(/^[•\-*\d.)\s]+/, "").trim();
        if (clean.length < 15 || clean.length > 150) return;

        // Categorize sentences
        const lower = clean.toLowerCase();
        
        // Warnings/cautions
        if (lower.includes("warning") || lower.includes("caution") || lower.includes("danger") || 
            lower.includes("don't drive") || lower.includes("stop driving") || lower.includes("immediately")) {
          if (importantWarnings.length < 2 && !importantWarnings.some(w => w.toLowerCase().includes(clean.toLowerCase().slice(0, 30)))) {
            importantWarnings.push(clean);
          }
        }
        // Action items
        else if (lower.includes("should") || lower.includes("recommend") || lower.includes("need to") || 
                 lower.includes("check") || lower.includes("replace") || lower.includes("inspect") ||
                 lower.includes("visit") || lower.includes("get")) {
          if (actionItems.length < 4 && !actionItems.some(a => a.toLowerCase().includes(clean.toLowerCase().slice(0, 30)))) {
            actionItems.push(clean);
          }
        }
        // Key points
        else if (lower.includes("because") || lower.includes("caused by") || lower.includes("likely") ||
                 lower.includes("usually") || lower.includes("common") || lower.includes("means")) {
          if (keyPoints.length < 3 && !keyPoints.some(k => k.toLowerCase().includes(clean.toLowerCase().slice(0, 30)))) {
            keyPoints.push(clean);
          }
        }
      });
    });

    // Fallback if no key points found
    if (keyPoints.length === 0 && assistantMessages.length > 0) {
      const lastMsg = assistantMessages[assistantMessages.length - 1].content;
      const sentences = lastMsg.split(/[.!?]+/).filter((s) => s.trim().length > 20 && s.trim().length < 150);
      sentences.slice(0, 2).forEach((s) => {
        keyPoints.push(s.trim());
      });
    }

    // Fallback action items
    if (actionItems.length === 0) {
      actionItems.push("Review the full conversation for specific recommendations");
    }

    return { mainTopic, keyPoints, actionItems, importantWarnings };
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const generateTextSummary = () => {
    let text = "CREW'S TAKE - Chat Summary\n";
    text += "─".repeat(35) + "\n\n";

    text += "YOUR QUESTION:\n";
    text += `${summary.mainTopic}\n\n`;

    if (summary.importantWarnings.length > 0) {
      text += "⚠️ IMPORTANT WARNINGS:\n";
      summary.importantWarnings.forEach((w) => {
        text += `• ${w}\n`;
      });
      text += "\n";
    }

    if (summary.keyPoints.length > 0) {
      text += "KEY INSIGHTS:\n";
      summary.keyPoints.forEach((p) => {
        text += `• ${p}\n`;
      });
      text += "\n";
    }

    text += "RECOMMENDED ACTIONS:\n";
    summary.actionItems.forEach((item, i) => {
      text += `${i + 1}. ${item}\n`;
    });

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
          title: "Crew's Take",
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
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-xl animate-action-sheet-up max-h-[85vh] flex flex-col"
        style={{
          boxShadow: "0 -10px 40px hsl(0 0% 0% / 0.5), var(--shadow-glow)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">Crew's Take</h3>
              <p className="text-xs text-muted-foreground">Your conversation at a glance</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Your Question */}
          <div className="bg-secondary/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Your question</h4>
            </div>
            <p className="text-sm text-muted-foreground">{summary.mainTopic || "No question yet"}</p>
          </div>

          {/* Important Warnings */}
          {summary.importantWarnings.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                <span className="text-destructive">⚠️</span>
                Important
              </h4>
              <ul className="space-y-1.5">
                {summary.importantWarnings.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-destructive/90">
                    <span className="shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Insights */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                Key insights
              </h4>
              <ul className="space-y-2">
                {summary.keyPoints.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/20 rounded-lg p-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              Recommended actions
            </h4>
            <ol className="space-y-2">
              {summary.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <span className="text-primary font-semibold shrink-0 bg-primary/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border/20">
          <Button onClick={handleCopy} className="flex-1 btn-glow">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy summary"}
          </Button>
          <Button onClick={handleShare} variant="ghost" className="px-4">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrewsTakeSheet;
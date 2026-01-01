import { useState, useEffect } from "react";
import { X, Copy, Share2, Check, Sparkles } from "lucide-react";
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

  if (!isOpen) return null;

  // Generate summary from conversation
  const generateSummary = () => {
    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    // What you asked - summarize user questions
    const whatYouAsked = userMessages.slice(0, 3).map((msg) => {
      const content = msg.content.length > 80 ? msg.content.slice(0, 80) + "..." : msg.content;
      return content;
    });

    // What the crew suggests - extract key points from assistant responses
    const suggestions: string[] = [];
    assistantMessages.forEach((msg) => {
      const lines = msg.content.split("\n").filter((l) => l.trim());
      lines.forEach((line) => {
        if (line.includes("recommend") || line.includes("suggest") || line.includes("should") || line.includes("check")) {
          const clean = line.replace(/^[•\-*]\s*/, "").trim();
          if (clean.length > 10 && clean.length < 100 && suggestions.length < 5) {
            suggestions.push(clean);
          }
        }
      });
    });

    // Fallback suggestions
    if (suggestions.length === 0) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1];
      if (lastAssistant) {
        const sentences = lastAssistant.content.split(/[.!?]/).filter((s) => s.trim().length > 20);
        sentences.slice(0, 3).forEach((s) => {
          suggestions.push(s.trim());
        });
      }
    }

    // Next steps
    const nextSteps: string[] = [];
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    if (lastAssistant) {
      if (lastAssistant.content.toLowerCase().includes("mechanic")) {
        nextSteps.push("Consider visiting a mechanic for a professional inspection");
      }
      if (lastAssistant.content.toLowerCase().includes("check") || lastAssistant.content.toLowerCase().includes("inspect")) {
        nextSteps.push("Perform visual inspection of the mentioned components");
      }
      if (lastAssistant.content.toLowerCase().includes("monitor") || lastAssistant.content.toLowerCase().includes("watch")) {
        nextSteps.push("Monitor for any changes or worsening symptoms");
      }
    }

    if (nextSteps.length === 0) {
      nextSteps.push("Review the conversation for specific recommendations");
    }

    return { whatYouAsked, suggestions, nextSteps };
  };

  const summary = generateSummary();

  const generateTextSummary = () => {
    let text = "CREW'S TAKE\n";
    text += "Quick summary of this chat\n";
    text += "─".repeat(30) + "\n\n";

    text += "WHAT YOU ASKED:\n";
    summary.whatYouAsked.forEach((q) => {
      text += `• ${q}\n`;
    });
    text += "\n";

    text += "WHAT THE CREW SUGGESTS:\n";
    summary.suggestions.forEach((s) => {
      text += `• ${s}\n`;
    });
    text += "\n";

    text += "NEXT STEPS:\n";
    summary.nextSteps.forEach((step, i) => {
      text += `${i + 1}. ${step}\n`;
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
      } catch (error) {
        // User cancelled or share failed
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
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-xl animate-action-sheet-up max-h-[80vh] flex flex-col"
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
              <p className="text-xs text-muted-foreground">Quick summary of this chat so far</p>
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
          {/* What you asked */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">What you asked</h4>
            <ul className="space-y-1.5">
              {summary.whatYouAsked.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What the crew suggests */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">What the crew suggests</h4>
            <ul className="space-y-1.5">
              {summary.suggestions.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next steps */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Next steps</h4>
            <ol className="space-y-1.5">
              {summary.nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                  <span>{item}</span>
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

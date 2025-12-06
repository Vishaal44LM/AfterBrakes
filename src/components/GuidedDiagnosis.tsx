import { useState, useRef, useEffect } from "react";
import { Wrench, ArrowLeft, MessageCircle, FileText, Check, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GuidedCheckStep, { StepStatus } from "./GuidedCheckStep";
import MechanicSummary from "./MechanicSummary";
import { Vehicle } from "@/hooks/useVehicles";

interface DiagnosisStep {
  title: string;
  content: string;
}

interface GuidedDiagnosisProps {
  symptom: string;
  images?: string[];
  vehicle: Vehicle | null;
  onBack: () => void;
  onOpenChat: () => void;
}

type SafetyLevel = "safe" | "caution" | "danger";

const GuidedDiagnosis = ({
  symptom,
  images,
  vehicle,
  onBack,
  onOpenChat,
}: GuidedDiagnosisProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel | null>(null);
  const [safetyReason, setSafetyReason] = useState("");
  const [intro, setIntro] = useState("");
  const [steps, setSteps] = useState<DiagnosisStep[]>([]);
  const [likelyAreas, setLikelyAreas] = useState("");
  const [mechanicSummary, setMechanicSummary] = useState("");
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [rawResponse, setRawResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps, isLoading]);

  useEffect(() => {
    fetchDiagnosis();
  }, []);

  const parseResponse = (text: string) => {
    // Extract title (first line)
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length > 0) {
      setTitle(lines[0].replace(/^#+\s*/, "").replace(/^\*\*|\*\*$/g, ""));
    }

    // Extract safety level
    const safetyMatch = text.match(/Safety level:\s*(Safe to drive|Drive with caution|Do not drive)[.!]?/i);
    if (safetyMatch) {
      const level = safetyMatch[1].toLowerCase();
      if (level.includes("do not")) setSafetyLevel("danger");
      else if (level.includes("caution")) setSafetyLevel("caution");
      else setSafetyLevel("safe");

      // Get safety reason (text after the safety level on same line or next sentence)
      const afterSafety = text.slice(text.indexOf(safetyMatch[0]) + safetyMatch[0].length);
      const reasonMatch = afterSafety.match(/^[^.]*\./);
      if (reasonMatch) {
        setSafetyReason(reasonMatch[0].trim());
      }
    }

    // Extract intro (text between safety and first step)
    const introMatch = text.match(/Safety level:[^\n]*\n+([\s\S]*?)(?=\n\s*(?:\d+\.|Step \d|##))/i);
    if (introMatch) {
      setIntro(introMatch[1].trim());
    }

    // Extract steps
    const stepPattern = /(?:^|\n)\s*(?:\*\*)?(\d+)\.\s*(?:\*\*)?([^*\n]+?)(?:\*\*)?[\n:]\s*([\s\S]*?)(?=(?:\n\s*(?:\*\*)?\d+\.)|(?:\n\s*(?:Likely|Summary|##))|\n\n\n|$)/gi;
    const extractedSteps: DiagnosisStep[] = [];
    let match;
    while ((match = stepPattern.exec(text)) !== null) {
      extractedSteps.push({
        title: match[2].trim(),
        content: match[3].trim().replace(/^\s*[-•]\s*/gm, "• "),
      });
    }
    if (extractedSteps.length > 0) {
      setSteps(extractedSteps);
      setStepStatuses(extractedSteps.map(() => "pending"));
    }

    // Extract likely areas
    const likelyMatch = text.match(/(?:Likely areas?|Likely cause|Also possible)[\s\S]*?(?=Summary for|$)/i);
    if (likelyMatch) {
      setLikelyAreas(likelyMatch[0].trim());
    }

    // Extract mechanic summary
    const summaryMatch = text.match(/Summary for (?:your )?mechanic:?([\s\S]*?)$/i);
    if (summaryMatch) {
      setMechanicSummary(summaryMatch[1].trim());
    }
  };

  const fetchDiagnosis = async () => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pit-crew-check`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          symptom,
          images,
          vehicle: vehicle
            ? {
                manufacturer: vehicle.manufacturer,
                model: vehicle.model,
                year: vehicle.year,
              }
            : null,
        }),
      });

      if (!resp.ok) throw new Error("Failed to get diagnosis");
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setRawResponse(fullResponse);
              parseResponse(fullResponse);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Diagnosis error:", error);
      setIsLoading(false);
    }
  };

  const handleStepStatusChange = (index: number, status: StepStatus) => {
    setStepStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[index] = status;
      return newStatuses;
    });
  };

  const completedSteps = stepStatuses.filter((s) => s === "done").length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const getSafetyBadge = () => {
    if (!safetyLevel) return null;

    const config = {
      safe: {
        icon: Check,
        text: "Safe to drive",
        className: "text-muted-foreground",
      },
      caution: {
        icon: AlertTriangle,
        text: "Drive with caution",
        className: "text-primary",
      },
      danger: {
        icon: XCircle,
        text: "Do not drive",
        className: "text-foreground font-semibold",
      },
    };

    const { icon: Icon, text, className } = config[safetyLevel];

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{text}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="btn-glow hover:bg-secondary/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Pit Crew Check</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenChat}
          className="btn-glow hover:bg-secondary/50"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title and safety badge */}
          {title && (
            <div className="animate-fade-slide-up">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                {title}
              </h2>
              {getSafetyBadge()}
              {safetyReason && (
                <p className="text-sm text-muted-foreground mt-1">{safetyReason}</p>
              )}
            </div>
          )}

          {/* Intro */}
          {intro && (
            <p className="text-body text-muted-foreground animate-fade-slide-up">
              {intro}
            </p>
          )}

          {/* Progress indicator */}
          {steps.length > 0 && (
            <div className="flex items-center gap-3 py-2 animate-fade-slide-up">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {completedSteps}/{totalSteps} · {progress}%
              </span>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="animate-fade-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <GuidedCheckStep
                  stepNumber={idx + 1}
                  title={step.title}
                  content={step.content}
                  status={stepStatuses[idx]}
                  onStatusChange={(status) => handleStepStatusChange(idx, status)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1.5">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <span className="text-sm text-muted-foreground">Preparing your checklist...</span>
            </div>
          )}

          {/* Likely areas */}
          {!isLoading && likelyAreas && (
            <div className="card-vignette p-5 animate-fade-slide-up">
              <h3 className="font-semibold text-foreground mb-3">Likely Areas</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {likelyAreas}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isLoading && steps.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 animate-fade-slide-up">
              <Button
                onClick={() => setShowSummary(true)}
                className="flex-1 btn-glow bg-primary hover:bg-primary/90"
              >
                <FileText className="w-4 h-4 mr-2" />
                Summary for Mechanic
              </Button>
              <Button
                variant="outline"
                onClick={onOpenChat}
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continue in Chat
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mechanic summary modal */}
      {showSummary && (
        <MechanicSummary
          messages={[
            { role: "user", content: symptom },
            { role: "assistant", content: rawResponse },
          ]}
          vehicle={vehicle}
          stepStatuses={stepStatuses}
          steps={steps}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
};

export default GuidedDiagnosis;

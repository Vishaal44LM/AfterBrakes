import { useState, useRef, useEffect } from "react";
import { Wrench, ArrowLeft, MessageCircle, ChevronUp, ChevronDown, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GuidedCheckStep, { StepStatus } from "./GuidedCheckStep";
import MechanicSummary from "./MechanicSummary";
import SeverityIndicator from "./SeverityIndicator";
import { Vehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

interface DiagnosisStep {
  title: string;
  content: string;
}

interface GuidedDiagnosisProps {
  symptom: string;
  images?: string[];
  vehicle: Vehicle | null;
  userId: string;
  onBack: () => void;
  onOpenChat: () => void;
  onStartNewCheck: () => void;
}

type SafetyLevel = "safe" | "caution" | "danger";

const GuidedDiagnosis = ({
  symptom,
  images,
  vehicle,
  userId,
  onBack,
  onOpenChat,
  onStartNewCheck,
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps, isLoading]);

  useEffect(() => {
    fetchDiagnosis();
  }, []);

  const cleanText = (text: string): string => {
    return text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^\s*[-]\s*/gm, "• ")
      .trim();
  };

  const parseResponse = (text: string) => {
    const cleanedText = cleanText(text);
    
    const lines = cleanedText.split("\n").filter((l) => l.trim());
    if (lines.length > 0) {
      setTitle(lines[0].replace(/^#+\s*/, "").trim());
    }

    const safetyMatch = cleanedText.match(/Safety level:\s*(Safe to drive|Drive with caution|Do not drive)[.!]?/i);
    if (safetyMatch) {
      const level = safetyMatch[1].toLowerCase();
      if (level.includes("do not")) setSafetyLevel("danger");
      else if (level.includes("caution")) setSafetyLevel("caution");
      else setSafetyLevel("safe");

      const afterSafety = cleanedText.slice(cleanedText.indexOf(safetyMatch[0]) + safetyMatch[0].length);
      const reasonMatch = afterSafety.match(/^[^.]*\./);
      if (reasonMatch) {
        setSafetyReason(reasonMatch[0].trim());
      }
    }

    const introMatch = cleanedText.match(/Safety level:[^\n]*\n+([\s\S]*?)(?=\n\s*(?:\d+\.|Step \d|##))/i);
    if (introMatch) {
      setIntro(introMatch[1].trim());
    }

    const stepPattern = /(?:^|\n)\s*(\d+)\.\s*([^\n•]+?)[\n:]\s*([\s\S]*?)(?=(?:\n\s*\d+\.)|(?:\n\s*(?:Likely|Summary|##))|\n\n\n|$)/gi;
    const extractedSteps: DiagnosisStep[] = [];
    let match;
    while ((match = stepPattern.exec(cleanedText)) !== null) {
      extractedSteps.push({
        title: match[2].trim(),
        content: match[3].trim(),
      });
    }
    if (extractedSteps.length > 0) {
      setSteps(extractedSteps);
      setStepStatuses(extractedSteps.map(() => "pending"));
    }

    const likelyMatch = cleanedText.match(/(?:Likely areas?|Likely cause|Also possible)[\s\S]*?(?=Summary for|$)/i);
    if (likelyMatch) {
      setLikelyAreas(likelyMatch[0].trim());
    }

    const summaryMatch = cleanedText.match(/Summary for (?:your )?mechanic:?([\s\S]*?)$/i);
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
                fuel: vehicle.fuel,
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

  const handleSaveCheck = async () => {
    if (!userId) return;
    
    try {
      const checkTitle = title || `Check: ${symptom.substring(0, 50)}`;
      const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;
      
      await supabase.from("chat_history").insert({
        user_id: userId,
        title: checkTitle,
        messages: [
          { role: "user", content: symptom },
          { role: "assistant", content: rawResponse },
        ] as any,
        vehicle_id: vehicle?.id || null,
        vehicle_tag: vehicleTag,
      });
      
      setIsSaved(true);
      toast({
        title: "Check saved",
        description: "You can find this in your history.",
      });
    } catch (error) {
      console.error("Error saving check:", error);
      toast({
        title: "Error",
        description: "Failed to save check",
        variant: "destructive",
      });
    }
  };

  const completedSteps = stepStatuses.filter((s) => s === "done").length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Skeleton loading state
  if (isLoading && steps.length === 0) {
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

          <div className="w-20" />
        </div>

        {/* Skeleton content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
            {/* Safety badge skeleton */}
            <div className="h-8 w-40 bg-secondary/50 rounded-full" />
            
            {/* Title skeleton */}
            <div className="h-6 w-3/4 bg-secondary/50 rounded-lg" />
            
            {/* Intro skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-secondary/30 rounded" />
              <div className="h-4 w-2/3 bg-secondary/30 rounded" />
            </div>
            
            {/* Steps skeleton */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-card/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/50 rounded-full" />
                    <div className="h-5 w-1/2 bg-secondary/50 rounded" />
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="h-3 w-full bg-secondary/30 rounded" />
                    <div className="h-3 w-3/4 bg-secondary/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary skeleton */}
            <div className="bg-card/50 rounded-2xl p-4 space-y-3">
              <div className="h-5 w-40 bg-secondary/50 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-secondary/30 rounded" />
                <div className="h-3 w-full bg-secondary/30 rounded" />
                <div className="h-3 w-2/3 bg-secondary/30 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Bottom sheet style content */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* Collapsible header bar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-sm border-b border-border/20"
          >
            <div className="flex items-center gap-3">
              {safetyLevel && <SeverityIndicator severity={safetyLevel} />}
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {title || "Checking..."}
              </span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {isExpanded && (
            <div className="flex-1 px-4 py-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Safety reason */}
                {safetyReason && (
                  <p className="text-sm text-muted-foreground animate-fade-slide-up">
                    {safetyReason}
                  </p>
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
                      {completedSteps}/{totalSteps}
                    </span>
                  </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
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

                {/* Likely areas */}
                {!isLoading && likelyAreas && (
                  <div className="card-vignette p-4 animate-fade-slide-up">
                    <h3 className="font-semibold text-foreground mb-2 text-sm">Likely Areas</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {likelyAreas}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Footer actions - always visible */}
          {!isLoading && steps.length > 0 && (
            <div className="sticky bottom-0 border-t border-border/20 bg-background/95 backdrop-blur-sm p-4">
              <div className="max-w-2xl mx-auto flex gap-3">
                <Button
                  onClick={handleSaveCheck}
                  disabled={isSaved}
                  className="flex-1 btn-glow bg-primary hover:bg-primary/90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaved ? "Saved" : "Save check"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onStartNewCheck}
                  className="flex-1 border-border/40 hover:bg-secondary/50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start new check
                </Button>
              </div>
              
              {/* View mechanic summary */}
              <button
                onClick={() => setShowSummary(true)}
                className="w-full mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View summary for mechanic →
              </button>
            </div>
          )}
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
import { useState, useEffect } from "react";
import { X, MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import DiagnosisStep, { DiagnosisStepData, StepStatus } from "./DiagnosisStep";
import DiagnosisSummary, { DiagnosisResult } from "./DiagnosisSummary";
import { Vehicle } from "@/hooks/useVehicles";
import { cn } from "@/lib/utils";

interface GuidedDiagnosisProps {
  symptom: string;
  vehicle: Vehicle | null;
  onClose: () => void;
  onAskQuestion: (question: string) => void;
}

interface StepState {
  status: StepStatus;
  followUpAnswer?: string;
}

const GuidedDiagnosis = ({ symptom, vehicle, onClose, onAskQuestion }: GuidedDiagnosisProps) => {
  const [steps, setSteps] = useState<DiagnosisStepData[]>([]);
  const [stepStates, setStepStates] = useState<Record<number, StepState>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [contextSummary, setContextSummary] = useState("");
  const [cantDoCount, setCantDoCount] = useState(0);
  const { toast } = useToast();

  const vehicleInfo = vehicle
    ? `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`
    : null;

  const totalSteps = steps.length;
  const completedSteps = Object.values(stepStates).filter(
    (s) => s.status !== "pending"
  ).length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Generate diagnosis steps on mount
  useEffect(() => {
    generateDiagnosisSteps();
  }, []);

  // Check for too many "can't do" steps
  useEffect(() => {
    const cantDos = Object.values(stepStates).filter(s => s.status === "cant-do").length;
    setCantDoCount(cantDos);
  }, [stepStates]);

  const generateDiagnosisSteps = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            symptom,
            vehicle: vehicle
              ? {
                  manufacturer: vehicle.manufacturer,
                  model: vehicle.model,
                  year: vehicle.year,
                }
              : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate diagnosis");
      }

      const data = await response.json();
      setSteps(data.steps);
      setContextSummary(data.contextSummary);
      
      // Initialize step states
      const initialStates: Record<number, StepState> = {};
      data.steps.forEach((step: DiagnosisStepData) => {
        initialStates[step.id] = { status: "pending" };
      });
      setStepStates(initialStates);
    } catch (error) {
      console.error("Error generating diagnosis:", error);
      toast({
        title: "Error",
        description: "Failed to generate diagnosis steps. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepStatusChange = async (stepId: number, status: StepStatus, followUpAnswer?: string) => {
    setStepStates((prev) => ({
      ...prev,
      [stepId]: { status, followUpAnswer },
    }));

    // Move to next step or show results
    if (stepId === totalSteps) {
      // Last step completed - generate results
      await generateResults();
    } else {
      setCurrentStep(stepId + 1);
    }
  };

  const generateResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diagnosis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            symptom,
            vehicle: vehicle
              ? {
                  manufacturer: vehicle.manufacturer,
                  model: vehicle.model,
                  year: vehicle.year,
                }
              : null,
            stepResults: Object.entries(stepStates).map(([id, state]) => ({
              stepId: parseInt(id),
              status: state.status,
              followUpAnswer: state.followUpAnswer,
            })),
            generateResult: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate results");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error("Error generating results:", error);
      toast({
        title: "Error",
        description: "Failed to generate diagnosis results.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = () => {
    const stepTitle = steps[currentStep - 1]?.title || "this step";
    onAskQuestion(`I have a question about ${stepTitle} while diagnosing: ${symptom}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="font-semibold text-foreground">Guided Diagnosis</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto">
              {symptom}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Progress bar */}
        {!result && totalSteps > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Context Summary Chip */}
      {contextSummary && !result && (
        <div className="px-4 py-3 border-b border-border/20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
            <span className="font-medium">Likely context:</span>
            <span className="text-foreground">{contextSummary}</span>
          </div>
        </div>
      )}

      {/* Warning banner for too many "can't do" */}
      {cantDoCount >= 2 && !result && (
        <div className="px-4 py-3 bg-diagnosis-warning/10 border-b border-diagnosis-warning/30">
          <p className="text-sm text-diagnosis-warning">
            Some checks need a workshop. It may be safer to get this inspected in person.
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && !steps.length ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Analyzing your symptoms...</p>
          </div>
        ) : result ? (
          <DiagnosisSummary
            result={result}
            symptom={symptom}
            vehicleInfo={vehicleInfo || undefined}
          />
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {steps.map((step) => (
              <DiagnosisStep
                key={step.id}
                step={step}
                status={stepStates[step.id]?.status || "pending"}
                isActive={currentStep === step.id}
                isUpcoming={step.id > currentStep}
                onStatusChange={(status, answer) =>
                  handleStepStatusChange(step.id, status, answer)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom panel */}
      {!result && !isLoading && (
        <div className="flex-shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex-1">
              After each step, I'll refine what might be wrong.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAskQuestion}
              className="text-primary hover:text-primary/80 flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Ask about this step
            </Button>
          </div>
        </div>
      )}

      {/* Close button for results */}
      {result && (
        <div className="flex-shrink-0 border-t border-border/40 bg-card/80 backdrop-blur-sm px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <Button onClick={onClose} className="w-full">
              Return to Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedDiagnosis;

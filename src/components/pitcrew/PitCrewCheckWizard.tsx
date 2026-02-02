import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, Wrench, Car, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import InputStrengthMeter from "./InputStrengthMeter";
import VehicleInputStep from "./VehicleInputStep";
import UsageBehaviorStep from "./UsageBehaviorStep";
import SymptomCaptureStep from "./SymptomCaptureStep";
import FailureTimeline from "./FailureTimeline";
import {
  VehicleInputs,
  UsageBehaviorInputs,
  SymptomInputs,
  PredictionResult,
  FailureRisk,
  DEFAULT_VEHICLE_INPUTS,
  DEFAULT_USAGE_INPUTS,
  DEFAULT_SYMPTOM_INPUTS,
  CONDITION_OPTIONS,
} from "./types";

interface PitCrewCheckWizardProps {
  vehicle: Vehicle | null;
  userId: string;
  onBack: () => void;
  onOpenChat: (prefillMessage?: string) => void;
  onComplete?: () => void;
}

const STEPS = [
  { id: 1, title: "Vehicle Details", description: "Basic vehicle information" },
  { id: 2, title: "Usage & Behavior", description: "How you drive" },
  { id: 3, title: "Symptoms", description: "What you're experiencing" },
  { id: 4, title: "Results", description: "Failure risk predictions" },
];

const PitCrewCheckWizard = ({
  vehicle,
  userId,
  onBack,
  onOpenChat,
  onComplete,
}: PitCrewCheckWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleData, setVehicleData] = useState<VehicleInputs>(DEFAULT_VEHICLE_INPUTS);
  const [usageData, setUsageData] = useState<UsageBehaviorInputs>(DEFAULT_USAGE_INPUTS);
  const [symptomData, setSymptomData] = useState<SymptomInputs>(DEFAULT_SYMPTOM_INPUTS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Calculate input strength score
  const inputStrength = useMemo(() => {
    let score = 0;
    const maxScore = 100;

    // Vehicle inputs (40 points total)
    if (vehicleData.mileage) score += 15;
    if (vehicleData.usagePattern) score += 10;
    if (vehicleData.lastServiceDate || vehicleData.lastServiceMileage) score += 15;

    // Usage inputs (25 points total)
    if (usageData.averageDailyDistance !== 30) score += 5; // Changed from default
    if (usageData.drivingStyle) score += 7;
    if (usageData.roadCondition) score += 7;
    if (usageData.loadPattern) score += 6;

    // Symptom inputs (35 points total)
    const selectedSymptoms = symptomData.symptoms.filter((s) => s.selected).length;
    if (selectedSymptoms > 0) {
      score += Math.min(selectedSymptoms * 5, 15);
      score += 5; // frequency is always set
      score += 5; // severity is always set
      if (symptomData.conditions.length > 0) score += 5;
      if (symptomData.additionalNotes.trim()) score += 5;
    }

    return Math.min(score, maxScore);
  }, [vehicleData, usageData, symptomData]);

  // Check if mandatory fields are complete
  const isMandatoryComplete = useMemo(() => {
    return (
      vehicleData.mileage !== null &&
      vehicleData.usagePattern !== null &&
      (vehicleData.lastServiceDate !== null || vehicleData.lastServiceMileage !== null)
    );
  }, [vehicleData]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return isMandatoryComplete;
      case 2:
        return true; // All have defaults
      case 3:
        return symptomData.symptoms.some((s) => s.selected);
      default:
        return true;
    }
  }, [currentStep, isMandatoryComplete, symptomData]);

  const canGetPredictions = inputStrength >= 70;

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      if (!canGetPredictions) {
        toast({
          title: "More input needed",
          description: "Please provide more details to unlock predictions.",
          variant: "destructive",
        });
        return;
      }
      await fetchPredictions();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const buildInputSummary = () => {
    const selectedSymptoms = symptomData.symptoms
      .filter((s) => s.selected)
      .map((s) => s.label)
      .join(", ");

    const conditions = symptomData.conditions
      .map((c) => CONDITION_OPTIONS.find((opt) => opt.id === c)?.label)
      .filter(Boolean)
      .join(", ");

    return `
Vehicle: ${vehicle?.manufacturer || "Unknown"} ${vehicle?.model || ""} (${vehicle?.year || "Unknown"})
Fuel Type: ${vehicle?.fuel || "Unknown"}
Current Mileage: ${vehicleData.mileage} km
Driving Type: ${vehicleData.usagePattern}
Last Service: ${vehicleData.lastServiceDate || `at ${vehicleData.lastServiceMileage} km`}

Usage Profile:
- Average Daily Distance: ${usageData.averageDailyDistance} km
- Driving Style: ${usageData.drivingStyle}
- Road Conditions: ${usageData.roadCondition}
- Load Pattern: ${usageData.loadPattern}

Reported Symptoms: ${selectedSymptoms || "None specified"}
Frequency: ${symptomData.frequency}
Severity: ${symptomData.severity}
${conditions ? `Conditions: ${conditions}` : ""}
${symptomData.additionalNotes ? `Additional Notes: ${symptomData.additionalNotes}` : ""}
    `.trim();
  };

  const fetchPredictions = async () => {
    setIsLoading(true);
    setCurrentStep(4);

    try {
      const inputSummary = buildInputSummary();
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pit-crew-predict`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          inputSummary,
          inputStrength,
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

      if (!resp.ok) throw new Error("Failed to get predictions");
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
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      parseResult(fullResponse);
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Error",
        description: "Failed to get predictions. Please try again.",
        variant: "destructive",
      });
      setCurrentStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const parseResult = async (text: string) => {
    // Parse the structured response
    const risks: FailureRisk[] = [];

    // Extract risk blocks - look for patterns like "Component: X" or numbered items
    const riskPattern = /(?:Component|Risk|Item)[\s:]*([^\n]+)[\s\S]*?(?:Risk Level|Level)[\s:]*(\w+)[\s\S]*?(?:Confidence)[\s:]*(\d+)[\s\S]*?(?:Estimated|Window|Timeline)[\s:]*([^\n]+)[\s\S]*?(?:Preventive|Action|Recommendation)[\s:]*([^\n]+)[\s\S]*?(?:Can it wait|Urgency)[\s:]*(\w+)[\s\S]*?(?:Reason|Reasoning|Explanation)[\s:]*([^\n]+)/gi;

    let match;
    while ((match = riskPattern.exec(text)) !== null) {
      const riskLevel = match[2].toLowerCase().includes("high")
        ? "high"
        : match[2].toLowerCase().includes("medium")
        ? "medium"
        : "low";

      const canWait = match[6].toLowerCase().includes("no")
        ? "no"
        : match[6].toLowerCase().includes("maybe")
        ? "maybe"
        : "yes";

      risks.push({
        component: match[1].trim(),
        riskLevel,
        confidence: parseInt(match[3]) || 70,
        estimatedWindow: match[4].trim(),
        preventiveAction: match[5].trim(),
        canItWait: canWait,
        reasoning: match[7].trim(),
      });
    }

    // If pattern matching failed, try to extract from simpler format
    if (risks.length === 0) {
      // Fallback: look for any bullet points or numbered items
      const lines = text.split("\n");
      let currentRisk: Partial<FailureRisk> = {};

      for (const line of lines) {
        const cleanLine = line.replace(/[*#]/g, "").trim();
        if (!cleanLine) continue;

        if (cleanLine.match(/^(brake|battery|tyre|tire|engine|suspension|oil|filter|belt|clutch|ac|air)/i)) {
          if (currentRisk.component) {
            risks.push({
              component: currentRisk.component || "Unknown",
              riskLevel: currentRisk.riskLevel || "medium",
              confidence: currentRisk.confidence || 70,
              estimatedWindow: currentRisk.estimatedWindow || "Within 6 months",
              preventiveAction: currentRisk.preventiveAction || "Schedule inspection",
              canItWait: currentRisk.canItWait || "maybe",
              reasoning: currentRisk.reasoning || "Based on usage patterns and mileage",
            });
          }
          currentRisk = { component: cleanLine.split(/[:-]/)[0].trim() };
        }

        if (cleanLine.toLowerCase().includes("high risk")) currentRisk.riskLevel = "high";
        if (cleanLine.toLowerCase().includes("medium risk")) currentRisk.riskLevel = "medium";
        if (cleanLine.toLowerCase().includes("low risk")) currentRisk.riskLevel = "low";
        if (cleanLine.match(/\d+%/)) {
          const conf = cleanLine.match(/(\d+)%/);
          if (conf) currentRisk.confidence = parseInt(conf[1]);
        }
        if (cleanLine.toLowerCase().includes("km") || cleanLine.toLowerCase().includes("month")) {
          currentRisk.estimatedWindow = cleanLine;
        }
      }

      // Add last risk
      if (currentRisk.component) {
        risks.push({
          component: currentRisk.component || "Unknown",
          riskLevel: currentRisk.riskLevel || "medium",
          confidence: currentRisk.confidence || 70,
          estimatedWindow: currentRisk.estimatedWindow || "Within 6 months",
          preventiveAction: currentRisk.preventiveAction || "Schedule inspection",
          canItWait: currentRisk.canItWait || "maybe",
          reasoning: currentRisk.reasoning || "Based on usage patterns and mileage",
        });
      }
    }

    // If still no risks, create default based on inputs
    if (risks.length === 0) {
      const selectedSymptoms = symptomData.symptoms.filter((s) => s.selected);
      for (const symptom of selectedSymptoms.slice(0, 4)) {
        risks.push({
          component: symptom.label.replace("Unusual ", "").replace(" issue", ""),
          riskLevel: symptomData.severity === "high" ? "high" : symptomData.severity === "medium" ? "medium" : "low",
          confidence: inputStrength,
          estimatedWindow: symptomData.frequency === "frequent" ? "Within 2 weeks" : "Within 2-4 weeks",
          preventiveAction: "Have a mechanic inspect this area",
          canItWait: symptomData.severity === "high" ? "no" : "maybe",
          reasoning: `Based on reported ${symptom.label.toLowerCase()} with ${symptomData.frequency} occurrence`,
        });
      }
    }

    const predictionResult: PredictionResult = {
      inputStrength,
      risks,
      overallAssessment: risks.some((r) => r.riskLevel === "high")
        ? "Some areas need attention soon"
        : "Monitor the listed areas during your next service",
      disclaimer: "Predictions are risk-based estimates, not guarantees.",
      rawResponse: text,
    };

    setResult(predictionResult);

    // Auto-save to history
    await saveToHistory(predictionResult);
  };

  const saveToHistory = async (predictionResult: PredictionResult) => {
    if (!userId) return;

    try {
      const inputSummary = buildInputSummary();
      const checkTitle = `Risk Check: ${symptomData.symptoms
        .filter((s) => s.selected)
        .map((s) => s.label)
        .slice(0, 2)
        .join(", ")}`;

      const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;

      // Create a structured message format for history
      const historyData = {
        type: "pit-crew-check",
        inputStrength: predictionResult.inputStrength,
        vehicleData,
        usageData,
        symptomData: {
          ...symptomData,
          symptoms: symptomData.symptoms.filter((s) => s.selected),
        },
        risks: predictionResult.risks,
        overallAssessment: predictionResult.overallAssessment,
      };

      await supabase.from("chat_history").insert({
        user_id: userId,
        title: checkTitle,
        messages: [
          { role: "user", content: inputSummary },
          { role: "assistant", content: JSON.stringify(historyData) },
        ] as any,
        vehicle_id: vehicle?.id || null,
        vehicle_tag: vehicleTag,
      });

      setIsSaved(true);
    } catch (error) {
      console.error("Error saving check:", error);
    }
  };

  const handleAskFollowUp = () => {
    const topRisk = result?.risks[0];
    const prefill = topRisk
      ? `I got a risk prediction for "${topRisk.component}" on my ${vehicle?.manufacturer || "car"}. Can you explain more about this and what I should do?`
      : `I just completed a Pit Crew Check on my ${vehicle?.manufacturer || "car"}. Can you help me understand the results?`;
    onOpenChat(prefill);
  };

  const handleStartNew = () => {
    setCurrentStep(1);
    setVehicleData(DEFAULT_VEHICLE_INPUTS);
    setUsageData(DEFAULT_USAGE_INPUTS);
    setSymptomData(DEFAULT_SYMPTOM_INPUTS);
    setResult(null);
    setIsSaved(false);
  };

  // Loading state
  if (currentStep === 4 && isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-glow hover:bg-secondary/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Pit Crew Check</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative mb-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <Car className="w-12 h-12 text-muted-foreground" />
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "1s" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/70 rounded-full" />
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "2s" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/40 rounded-full" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-2">Analyzing failure risks...</p>
          <p className="text-xs text-muted-foreground/60">Input strength: {inputStrength}%</p>

          {/* Skeleton content */}
          <div className="w-full max-w-xl mt-8 space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary/50 rounded-full skeleton-shimmer" />
                  <div className="h-5 w-1/2 bg-secondary/50 rounded skeleton-shimmer" />
                </div>
                <div className="space-y-2 pl-11">
                  <div className="h-3 w-full bg-secondary/30 rounded skeleton-shimmer" />
                  <div className="h-3 w-3/4 bg-secondary/30 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (currentStep === 4 && result) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-glow hover:bg-secondary/50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Risk Predictions</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Overall assessment */}
            <div className="text-center space-y-2 animate-fade-slide-up">
              <h2 className="text-lg font-semibold text-foreground">{result.overallAssessment}</h2>
              <p className="text-sm text-muted-foreground">
                {result.risks.length} potential risk{result.risks.length !== 1 ? "s" : ""} identified
              </p>
            </div>

            {/* Failure Timeline */}
            <FailureTimeline risks={result.risks} inputStrength={result.inputStrength} />

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={handleAskFollowUp} className="w-full btn-glow">
                Ask follow-up questions
              </Button>
              <Button variant="outline" onClick={handleStartNew} className="w-full">
                Start new check
              </Button>
            </div>

            {isSaved && (
              <p className="text-xs text-center text-muted-foreground">
                Saved to your vehicle history
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <Button variant="ghost" size="sm" onClick={handleBack} className="btn-glow hover:bg-secondary/50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? "Back" : "Previous"}
        </Button>
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Pit Crew Check</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-4 border-b border-border/10">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {STEPS.slice(0, 3).map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {step.id}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 md:w-20 h-0.5 mx-2 transition-all ${
                    currentStep > step.id ? "bg-primary" : "bg-secondary/50"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <p className="text-sm font-medium text-foreground">{STEPS[currentStep - 1].title}</p>
          <p className="text-xs text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Input Strength Meter */}
      <div className="px-4 py-3 bg-secondary/10">
        <div className="max-w-xl mx-auto">
          <InputStrengthMeter score={inputStrength} />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto">
          {currentStep === 1 && (
            <VehicleInputStep data={vehicleData} vehicle={vehicle} onChange={setVehicleData} />
          )}
          {currentStep === 2 && <UsageBehaviorStep data={usageData} onChange={setUsageData} />}
          {currentStep === 3 && <SymptomCaptureStep data={symptomData} onChange={setSymptomData} />}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border/20">
        <div className="max-w-xl mx-auto">
          {!isMandatoryComplete && currentStep === 1 && (
            <p className="text-xs text-center text-destructive/80 mb-3">
              Complete required details to unlock Pit Crew Check
            </p>
          )}
          {currentStep === 3 && !canGetPredictions && (
            <p className="text-xs text-center text-yellow-400/80 mb-3">
              Input strength must reach 70% for predictions
            </p>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || (currentStep === 3 && !canGetPredictions)}
            className="w-full btn-glow"
          >
            {currentStep === 3 ? (
              <>
                Get Predictions
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitCrewCheckWizard;

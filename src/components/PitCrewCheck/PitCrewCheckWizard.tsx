import { useState, useMemo } from "react";
import { ArrowLeft, ChevronRight, ChevronLeft, Wrench, Lock, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Vehicle } from "@/hooks/useVehicles";
import {
  VehicleInputs,
  UsageBehaviorInputs,
  SymptomInputs,
  InputStrength,
  PredictionResult,
  RiskPrediction,
} from "./types";
import StepVehicleDetails from "./StepVehicleDetails";
import StepUsageBehavior from "./StepUsageBehavior";
import StepSymptoms from "./StepSymptoms";
import InputStrengthMeter from "./InputStrengthMeter";
import FailureTimeline from "./FailureTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PitCrewCheckWizardProps {
  vehicle: Vehicle | null;
  userId: string;
  onBack: () => void;
  onOpenChat: (prefill?: string) => void;
}

const THRESHOLD_SCORE = 70;

const PitCrewCheckWizard = ({
  vehicle,
  userId,
  onBack,
  onOpenChat,
}: PitCrewCheckWizardProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const { toast } = useToast();

  // Form data
  const [vehicleData, setVehicleData] = useState<VehicleInputs>({
    mileage: "",
    usagePattern: "",
    lastServiceDate: "",
    lastServiceMileage: "",
  });

  const [usageData, setUsageData] = useState<UsageBehaviorInputs>({
    avgDailyDistance: 30,
    drivingStyle: "",
    roadCondition: "",
    loadPattern: "",
  });

  const [symptomData, setSymptomData] = useState<SymptomInputs>({
    symptoms: [],
    additionalNotes: "",
  });

  // Calculate input strength score
  const inputScore = useMemo(() => {
    let score = 0;
    const weights = {
      vehicleMileage: 15,
      usagePattern: 10,
      lastService: 10,
      avgDistance: 5,
      drivingStyle: 10,
      roadCondition: 10,
      loadPattern: 5,
      symptoms: 25,
      symptomDetails: 10,
    };

    // Vehicle data
    if (vehicleData.mileage) score += weights.vehicleMileage;
    if (vehicleData.usagePattern) score += weights.usagePattern;
    if (vehicleData.lastServiceDate || vehicleData.lastServiceMileage) score += weights.lastService;

    // Usage data
    if (usageData.avgDailyDistance > 5) score += weights.avgDistance;
    if (usageData.drivingStyle) score += weights.drivingStyle;
    if (usageData.roadCondition) score += weights.roadCondition;
    if (usageData.loadPattern) score += weights.loadPattern;

    // Symptoms
    const checkedSymptoms = symptomData.symptoms.filter(s => s.checked);
    if (checkedSymptoms.length > 0) {
      score += weights.symptoms;
      
      // Bonus for detailed symptoms
      const hasDetails = checkedSymptoms.some(s => s.conditions.length > 0);
      if (hasDetails) score += weights.symptomDetails;
    }

    return Math.min(100, score);
  }, [vehicleData, usageData, symptomData]);

  const inputStrength: InputStrength = useMemo(() => {
    if (inputScore >= 80) return "strong";
    if (inputScore >= THRESHOLD_SCORE) return "medium";
    return "weak";
  }, [inputScore]);

  // Check if mandatory fields are complete
  const isMandatoryComplete = useMemo(() => {
    return (
      vehicle !== null &&
      vehicleData.mileage !== "" &&
      vehicleData.usagePattern !== "" &&
      (vehicleData.lastServiceDate !== "" || vehicleData.lastServiceMileage !== "")
    );
  }, [vehicle, vehicleData]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return (
          vehicle !== null &&
          vehicleData.mileage !== "" &&
          vehicleData.usagePattern !== "" &&
          (vehicleData.lastServiceDate !== "" || vehicleData.lastServiceMileage !== "")
        );
      case 2:
        return (
          usageData.drivingStyle !== "" &&
          usageData.roadCondition !== "" &&
          usageData.loadPattern !== ""
        );
      case 3:
        return inputScore >= THRESHOLD_SCORE;
      default:
        return true;
    }
  }, [step, vehicle, vehicleData, usageData, inputScore]);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      await fetchPredictions();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const buildInputContext = () => {
    const checkedSymptoms = symptomData.symptoms.filter(s => s.checked);
    
    return {
      vehicle: vehicle ? {
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        year: vehicle.year,
        fuel: vehicle.fuel,
      } : null,
      mileage: parseInt(vehicleData.mileage) || 0,
      usagePattern: vehicleData.usagePattern,
      lastServiceDate: vehicleData.lastServiceDate,
      lastServiceMileage: vehicleData.lastServiceMileage,
      avgDailyDistance: usageData.avgDailyDistance,
      drivingStyle: usageData.drivingStyle,
      roadCondition: usageData.roadCondition,
      loadPattern: usageData.loadPattern,
      symptoms: checkedSymptoms.map(s => ({
        type: s.id,
        label: s.label,
        frequency: s.frequency,
        severity: s.severity,
        conditions: s.conditions,
      })),
      additionalNotes: symptomData.additionalNotes,
      inputScore,
      inputStrength,
    };
  };

  const fetchPredictions = async () => {
    setIsLoading(true);
    setStep(4);

    try {
      const context = buildInputContext();
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pit-crew-check`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(context),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get predictions");
      }
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

      parseAndSetResult(fullResponse, context);
      saveToHistory(fullResponse, context);
    } catch (error) {
      console.error("Prediction error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get predictions. Please try again.",
        variant: "destructive",
      });
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAndSetResult = (response: string, context: any) => {
    const predictions = parseAIPredictions(response);
    
    const vehicleName = vehicle 
      ? `${vehicle.manufacturer} ${vehicle.model} (${vehicle.year})`
      : "Your vehicle";

    setResult({
      inputStrength,
      inputScore,
      predictions,
      disclaimer: "Predictions are risk-based estimates, not guarantees. Always consult a qualified mechanic for accurate diagnosis and before making any repair decisions.",
      vehicleSummary: `Based on ${vehicleName} with ${vehicleData.mileage} km, ${vehicleData.usagePattern} driving pattern, ${usageData.drivingStyle} driving style on ${usageData.roadCondition} roads.`,
    });
  };

  const parseAIPredictions = (response: string): RiskPrediction[] => {
    const predictions: RiskPrediction[] = [];
    
    // Split by the separator "---"
    const sections = response.split(/---+/).filter(s => s.trim());

    for (const section of sections) {
      const componentMatch = section.match(/Component:\s*(.+?)(?:\n|$)/i);
      const riskMatch = section.match(/Risk Level:\s*(High|Medium|Low)/i);
      const confidenceMatch = section.match(/Confidence:\s*(\d+)/i);
      const timeMatch = section.match(/Time Window:\s*(.+?)(?:\n|$)/i);
      const actionMatch = section.match(/Action:\s*(.+?)(?:\n|$)/i);
      const canWaitMatch = section.match(/Can Wait:\s*(Yes|No)/i);
      const reasonMatch = section.match(/Reason:\s*(.+?)(?:\n|$)/i);

      if (componentMatch && riskMatch) {
        predictions.push({
          component: componentMatch[1].trim(),
          riskLevel: (riskMatch[1].toLowerCase() as "low" | "medium" | "high"),
          confidence: parseInt(confidenceMatch?.[1] || "70"),
          timeWindow: timeMatch?.[1]?.trim() || "Within next service interval",
          preventiveAction: actionMatch?.[1]?.trim() || "Schedule inspection",
          canWait: canWaitMatch?.[1]?.toLowerCase() === "yes",
          reason: reasonMatch?.[1]?.trim() || "Based on vehicle data and usage patterns.",
        });
      }
    }

    // Fallback parsing if structured format didn't work
    if (predictions.length === 0) {
      const lines = response.split("\n");
      let currentPrediction: Partial<RiskPrediction> = {};
      
      for (const line of lines) {
        const cleanLine = line.replace(/^\*+|\*+$/g, "").trim();
        
        if (cleanLine.match(/^(component|risk|brake|battery|clutch|tire|suspension|engine|cooling)/i) && cleanLine.length < 60) {
          if (currentPrediction.component) {
            predictions.push({
              component: currentPrediction.component,
              riskLevel: currentPrediction.riskLevel || "medium",
              confidence: currentPrediction.confidence || 65,
              timeWindow: currentPrediction.timeWindow || "Within 5,000 km",
              preventiveAction: currentPrediction.preventiveAction || "Schedule inspection",
              canWait: currentPrediction.canWait ?? true,
              reason: currentPrediction.reason || "Based on analysis",
            });
          }
          currentPrediction = { component: cleanLine };
        } else if (cleanLine.toLowerCase().includes("high risk")) {
          currentPrediction.riskLevel = "high";
          currentPrediction.canWait = false;
        } else if (cleanLine.toLowerCase().includes("medium risk")) {
          currentPrediction.riskLevel = "medium";
        } else if (cleanLine.toLowerCase().includes("low risk")) {
          currentPrediction.riskLevel = "low";
          currentPrediction.canWait = true;
        }
      }

      // Push last prediction
      if (currentPrediction.component) {
        predictions.push({
          component: currentPrediction.component,
          riskLevel: currentPrediction.riskLevel || "medium",
          confidence: currentPrediction.confidence || 65,
          timeWindow: currentPrediction.timeWindow || "Within 5,000 km",
          preventiveAction: currentPrediction.preventiveAction || "Schedule inspection",
          canWait: currentPrediction.canWait ?? true,
          reason: currentPrediction.reason || "Based on analysis",
        });
      }
    }

    // Ultimate fallback: create baseline predictions
    if (predictions.length === 0) {
      const mileage = parseInt(vehicleData.mileage) || 0;
      
      // Add baseline wear predictions based on mileage
      if (mileage > 30000) {
        predictions.push({
          component: "Brake System",
          riskLevel: mileage > 50000 ? "medium" : "low",
          confidence: 60,
          timeWindow: "Within next 10,000 km",
          preventiveAction: "Schedule brake inspection and pad measurement",
          canWait: true,
          reason: `At ${mileage} km, brake components typically show wear. Regular inspection recommended.`,
        });
      }

      if (mileage > 40000) {
        predictions.push({
          component: "Battery",
          riskLevel: mileage > 60000 ? "medium" : "low",
          confidence: 55,
          timeWindow: "Within 6-12 months",
          preventiveAction: "Test battery health and charging system",
          canWait: true,
          reason: `Batteries typically last 3-5 years. At ${mileage} km, performance monitoring is advised.`,
        });
      }

      predictions.push({
        component: "General Maintenance",
        riskLevel: "low",
        confidence: 70,
        timeWindow: "At next service interval",
        preventiveAction: "Follow manufacturer service schedule",
        canWait: true,
        reason: "Preventive maintenance helps identify issues before they become problems.",
      });
    }

    return predictions;
  };

  const saveToHistory = async (response: string, context: any) => {
    try {
      const title = `Risk Check: ${vehicle?.manufacturer} ${vehicle?.model} - ${new Date().toLocaleDateString()}`;
      const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;

      await supabase.from("chat_history").insert({
        user_id: userId,
        title,
        messages: [
          { role: "user", content: JSON.stringify(context) },
          { role: "assistant", content: response },
        ] as any,
        vehicle_id: vehicle?.id || null,
        vehicle_tag: vehicleTag,
      });
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Vehicle Details";
      case 2:
        return "Usage & Behavior";
      case 3:
        return "Symptoms";
      case 4:
        return "Risk Analysis";
      default:
        return "Pit Crew Check";
    }
  };

  // Loading state
  if (step === 4 && isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-glow">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Pit Crew Check</span>
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
            </div>
          </div>

          <p className="text-sm text-foreground mb-2">Analyzing failure risks...</p>
          <p className="text-xs text-muted-foreground">Running 3-layer prediction engine</p>
          
          {/* Skeleton preview */}
          <div className="mt-8 w-full max-w-sm space-y-3">
            <div className="h-4 bg-secondary/50 rounded animate-pulse" />
            <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
            <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" style={{ animationDelay: "200ms" }} />
            <div className="h-20 bg-secondary/30 rounded-xl animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (step === 4 && result) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
          <Button variant="ghost" size="sm" onClick={onBack} className="btn-glow">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Risk Analysis</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-xl mx-auto">
            <FailureTimeline result={result} />

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => onOpenChat(`I just ran a Pit Crew Check on my ${vehicle?.manufacturer} ${vehicle?.model}. Can you help me understand the risk predictions?`)}
                variant="outline"
                className="w-full"
              >
                Discuss with Pit Lane Talk
              </Button>
              <Button onClick={onBack} variant="ghost" className="w-full">
                Run Another Check
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form steps
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <Button variant="ghost" size="sm" onClick={handleBack} className="btn-glow">
          {step === 1 ? (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </>
          )}
        </Button>
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">{getStepTitle()}</span>
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right">
          Step {step}/3
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Vehicle gate check */}
          {!vehicle && step === 1 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Vehicle Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please add a vehicle from your Garage before starting Pit Crew Check.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <StepVehicleDetails
              vehicle={vehicle}
              data={vehicleData}
              onChange={setVehicleData}
            />
          )}

          {step === 2 && (
            <StepUsageBehavior
              data={usageData}
              onChange={setUsageData}
            />
          )}

          {step === 3 && (
            <StepSymptoms
              data={symptomData}
              onChange={setSymptomData}
            />
          )}

          {/* Input strength meter - show on step 2 and 3 */}
          {step >= 2 && (
            <InputStrengthMeter
              score={inputScore}
              strength={inputStrength}
              threshold={THRESHOLD_SCORE}
              className="pt-4 border-t border-border/20"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/20">
        <div className="max-w-xl mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full gap-2"
          >
            {step === 3 ? (
              <>
                {inputScore >= THRESHOLD_SCORE ? "Get Predictions" : "Complete more details"}
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
          
          {step === 3 && inputScore < THRESHOLD_SCORE && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              Add symptoms or more details to unlock predictions
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitCrewCheckWizard;

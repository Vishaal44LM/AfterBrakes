import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Wrench,
  Car,
  Gauge,
  Zap,
  Circle,
  Volume2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Camera,
  Check,
  AlertTriangle,
  XCircle,
  MessageCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Vehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import SeverityIndicator from "./SeverityIndicator";

interface PitCrewWizardProps {
  vehicle: Vehicle | null;
  userId: string;
  onBack: () => void;
  onOpenChat: (prefillQuestion?: string) => void;
  onComplete?: () => void;
}

interface WizardData {
  // Step 1: Basics
  mileage: string;
  recentWork: boolean;
  recentWorkNote: string;
  // Step 2: Symptoms
  category: string;
  subSymptom: string;
  // Step 3: Conditions
  where: string;
  when: string;
  weather: string;
  additionalNote: string;
  // Step 4: Photos & Notes
  images: string[];
  description: string;
}

type SafetyLevel = "safe" | "caution" | "danger";

const symptomCategories = [
  { id: "brakes", label: "Brakes", icon: Circle },
  { id: "engine", label: "Engine", icon: Settings },
  { id: "steering", label: "Steering", icon: Gauge },
  { id: "tyres", label: "Tyres", icon: Circle },
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "other", label: "Other", icon: Volume2 },
];

const subSymptoms: Record<string, string[]> = {
  brakes: [
    "Squeak when braking softly",
    "Grinding all the time",
    "Pedal feels soft",
    "Car pulls to one side",
    "Vibration when braking",
    "Warning light on",
  ],
  engine: [
    "Check engine light",
    "Unusual noise",
    "Loss of power",
    "Overheating",
    "Oil leak",
    "Starting problems",
  ],
  steering: [
    "Hard to turn",
    "Vibration in wheel",
    "Pulling to one side",
    "Noise when turning",
    "Steering wheel off-center",
  ],
  tyres: [
    "Uneven wear",
    "Low pressure warning",
    "Vibration at speed",
    "Noise while driving",
    "Visible damage",
  ],
  electrical: [
    "Battery issues",
    "Lights flickering",
    "Dashboard warning",
    "AC not working",
    "Power windows issue",
  ],
  other: [
    "Strange smell",
    "Fluid leak",
    "Suspension noise",
    "Exhaust issue",
    "Something else",
  ],
};

const mileageOptions = ["< 25,000 km", "25,000 - 75,000 km", "> 75,000 km"];
const whereOptions = ["City", "Highway", "Both"];
const whenOptions = ["Cold start", "After driving a while", "Random"];
const weatherOptions = ["Dry", "Rainy", "Hot"];

const PitCrewWizard = ({
  vehicle,
  userId,
  onBack,
  onOpenChat,
  onComplete,
}: PitCrewWizardProps) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    mileage: "",
    recentWork: false,
    recentWorkNote: "",
    category: "",
    subSymptom: "",
    where: "",
    when: "",
    weather: "",
    additionalNote: "",
    images: [],
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    safetyLevel: SafetyLevel;
    summary: string;
    likelyCauses: string[];
    whatToWatch: string;
    timeframe: string;
    rawResponse: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  // Persist progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pitCrewWizardProgress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed.data);
        setStep(parsed.step);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (step < 5) {
      localStorage.setItem(
        "pitCrewWizardProgress",
        JSON.stringify({ data, step })
      );
    }
  }, [data, step]);

  const clearProgress = () => {
    localStorage.removeItem("pitCrewWizardProgress");
  };

  const getTimeEstimate = () => {
    const remaining = 5 - step;
    if (remaining <= 0) return "";
    return `~${remaining} min left`;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.mileage !== "";
      case 2:
        return data.category !== "" && data.subSymptom !== "";
      case 3:
        return data.where !== "" && data.when !== "";
      case 4:
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      // Submit and get diagnosis
      await fetchDiagnosis();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    let processedCount = 0;

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        processedCount++;
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processedCount++;
        if (processedCount === files.length) {
          setData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const buildSymptomText = () => {
    let text = `Category: ${data.category}\nSymptom: ${data.subSymptom}`;
    text += `\nMileage: ${data.mileage}`;
    if (data.recentWork && data.recentWorkNote) {
      text += `\nRecent work: ${data.recentWorkNote}`;
    }
    text += `\nOccurs: ${data.where} driving, ${data.when}`;
    if (data.weather) {
      text += `, in ${data.weather} weather`;
    }
    if (data.additionalNote) {
      text += `\nAdditional context: ${data.additionalNote}`;
    }
    if (data.description) {
      text += `\nUser description: ${data.description}`;
    }
    return text;
  };

  const fetchDiagnosis = async () => {
    setIsLoading(true);
    setStep(5);

    try {
      const symptomText = buildSymptomText();
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pit-crew-check`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          symptom: symptomText,
          images: data.images,
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
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse the response
      parseResult(fullResponse);
      clearProgress();
    } catch (error) {
      console.error("Diagnosis error:", error);
      toast({
        title: "Error",
        description: "Failed to get diagnosis. Please try again.",
        variant: "destructive",
      });
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const parseResult = async (text: string) => {
    // Extract safety level
    let safetyLevel: SafetyLevel = "caution";
    const safetyMatch = text.match(
      /Safety level:\s*(Safe to drive|Drive with caution|Do not drive)/i
    );
    if (safetyMatch) {
      const level = safetyMatch[1].toLowerCase();
      if (level.includes("do not")) safetyLevel = "danger";
      else if (level.includes("caution")) safetyLevel = "caution";
      else safetyLevel = "safe";
    }

    // Extract summary (first line after title)
    const lines = text.split("\n").filter((l) => l.trim());
    const summary = lines[0]?.replace(/^#+\s*/, "").trim() || "Diagnosis complete";

    // Extract likely causes
    const likelyCauses: string[] = [];
    const causesMatch = text.match(/Likely (?:causes?|areas?)[\s\S]*?(?=Summary|What to watch|$)/i);
    if (causesMatch) {
      const causeLines = causesMatch[0].split("\n").filter((l) => l.trim().startsWith("•") || l.trim().startsWith("-"));
      causeLines.slice(0, 3).forEach((line) => {
        likelyCauses.push(line.replace(/^[•-]\s*/, "").trim());
      });
    }
    if (likelyCauses.length === 0) {
      likelyCauses.push("Review the full diagnosis for details");
    }

    // Extract what to watch
    let whatToWatch = "Monitor for any changes in the symptom";
    const watchMatch = text.match(/What to watch[:\s]*(.*?)(?:\n|$)/i);
    if (watchMatch) {
      whatToWatch = watchMatch[1].trim();
    }

    // Determine timeframe
    let timeframe = "Check within a week";
    if (safetyLevel === "danger") {
      timeframe = "Check immediately";
    } else if (safetyLevel === "safe") {
      timeframe = "Check at next service";
    }

    const resultData = {
      safetyLevel,
      summary,
      likelyCauses,
      whatToWatch,
      timeframe,
      rawResponse: text,
    };

    setResult(resultData);

    // Auto-save to history
    if (userId) {
      try {
        const checkTitle = summary.substring(0, 100);
        const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;

        await supabase.from("chat_history").insert({
          user_id: userId,
          title: checkTitle,
          messages: [
            { role: "user", content: buildSymptomText() },
            { role: "assistant", content: text },
          ] as any,
          vehicle_id: vehicle?.id || null,
          vehicle_tag: vehicleTag,
        });

        setIsSaved(true);
      } catch (error) {
        console.error("Error auto-saving check:", error);
      }
    }
  };

  const handleSaveCheck = async () => {
    if (!userId || !result) return;

    try {
      const checkTitle = result.summary.substring(0, 100);
      const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;

      await supabase.from("chat_history").insert({
        user_id: userId,
        title: checkTitle,
        messages: [
          { role: "user", content: buildSymptomText() },
          { role: "assistant", content: result.rawResponse },
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


  const handleAskFollowUp = () => {
    const prefill = `I just got a diagnosis for "${data.subSymptom}" on my ${vehicle?.manufacturer || "car"}. Can you tell me more about ${result?.likelyCauses[0] || "this issue"}?`;
    onOpenChat(prefill);
  };

  // Loading state (Step 5 while loading)
  if (step === 5 && isLoading) {
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

          <p className="text-sm text-muted-foreground mb-8">Diagnosing...</p>

          <div className="w-full max-w-md space-y-4 animate-pulse">
            <div className="h-10 w-32 bg-secondary/50 rounded-full skeleton-shimmer mx-auto" />
            <div className="h-6 w-3/4 bg-secondary/50 rounded-lg skeleton-shimmer mx-auto" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-secondary/30 rounded skeleton-shimmer" style={{ width: `${90 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result state (Step 5 with result)
  if (step === 5 && result) {
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

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Hero card */}
            <div className="card-vignette p-6 animate-fade-slide-up">
              {/* Safety badge */}
              <div className="flex items-center gap-3 mb-4">
                {result.safetyLevel === "safe" && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Safe
                  </span>
                )}
                {result.safetyLevel === "caution" && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Caution
                  </span>
                )}
                {result.safetyLevel === "danger" && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Don't drive
                  </span>
                )}
              </div>

              {/* Summary */}
              <h2 className="text-lg font-semibold text-foreground mb-4">{result.summary}</h2>

              {/* Bullets */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-primary font-medium shrink-0">Likely causes:</span>
                  <span className="text-muted-foreground">{result.likelyCauses.join(", ")}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-medium shrink-0">What to watch:</span>
                  <span className="text-muted-foreground">{result.whatToWatch}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary font-medium shrink-0">Timeframe:</span>
                  <span className="text-muted-foreground">{result.timeframe}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-4 w-full p-4 rounded-2xl bg-card border border-border/40">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Saved to history</p>
                  <p className="text-xs text-muted-foreground">This check is saved automatically</p>
                </div>
              </div>

              <button
                onClick={handleAskFollowUp}
                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ask follow-up in Pit Lane Talk</p>
                  <p className="text-xs text-muted-foreground">Get more details about this diagnosis</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center px-4">
              This is guidance only. For emergencies or red warning lights, stop and call roadside assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Wizard steps 1-4
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <Button variant="ghost" size="sm" onClick={handleBack} className="btn-glow hover:bg-secondary/50">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Pit Crew Check</span>
        </div>
        <span className="text-xs text-muted-foreground">{getTimeEstimate()}</span>
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Step {step} of 5</span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto">
          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Tell us about the car</h2>
                <p className="text-sm text-muted-foreground">
                  {vehicle ? `${vehicle.manufacturer} ${vehicle.model} (${vehicle.year})` : "No vehicle selected"}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Mileage range</label>
                <div className="grid grid-cols-1 gap-2">
                  {mileageOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setData((prev) => ({ ...prev, mileage: option }))}
                      className={`p-4 rounded-2xl text-left transition-all ${
                        data.mileage === option
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-card border border-border/40 hover:border-primary/40"
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">{option}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Any recent work related to this issue?</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setData((prev) => ({ ...prev, recentWork: true }))}
                    className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                      data.recentWork
                        ? "bg-primary/20 border-2 border-primary text-foreground"
                        : "bg-card border border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setData((prev) => ({ ...prev, recentWork: false, recentWorkNote: "" }))}
                    className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                      !data.recentWork
                        ? "bg-primary/20 border-2 border-primary text-foreground"
                        : "bg-card border border-border/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    No
                  </button>
                </div>
                {data.recentWork && (
                  <Textarea
                    value={data.recentWorkNote}
                    onChange={(e) => setData((prev) => ({ ...prev, recentWorkNote: e.target.value }))}
                    placeholder="Briefly describe the work done..."
                    className="min-h-[80px] bg-card border-border/40"
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">What seems wrong?</h2>
                <p className="text-sm text-muted-foreground">Select a category and describe the issue</p>
              </div>

              {!data.category ? (
                <div className="grid grid-cols-2 gap-3">
                  {symptomCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setData((prev) => ({ ...prev, category: cat.id, subSymptom: "" }))}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all"
                    >
                      <cat.icon className="w-8 h-8 text-primary" />
                      <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setData((prev) => ({ ...prev, category: "", subSymptom: "" }))}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Change category
                  </button>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary capitalize">
                      {data.category}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {subSymptoms[data.category]?.map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => setData((prev) => ({ ...prev, subSymptom: symptom }))}
                        className={`w-full p-4 rounded-2xl text-left transition-all ${
                          data.subSymptom === symptom
                            ? "bg-primary/20 border-2 border-primary"
                            : "bg-card border border-border/40 hover:border-primary/40"
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground">{symptom}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Driving conditions */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">When does it happen?</h2>
                <p className="text-sm text-muted-foreground">Help us understand the conditions</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Where</label>
                  <div className="flex gap-2">
                    {whereOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setData((prev) => ({ ...prev, where: option }))}
                        className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                          data.where === option
                            ? "bg-primary/20 border-2 border-primary text-foreground"
                            : "bg-card border border-border/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">When</label>
                  <div className="grid grid-cols-1 gap-2">
                    {whenOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setData((prev) => ({ ...prev, when: option }))}
                        className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
                          data.when === option
                            ? "bg-primary/20 border-2 border-primary text-foreground"
                            : "bg-card border border-border/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Weather (optional)</label>
                  <div className="flex gap-2">
                    {weatherOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setData((prev) => ({ ...prev, weather: data.weather === option ? "" : option }))}
                        className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
                          data.weather === option
                            ? "bg-primary/20 border-2 border-primary text-foreground"
                            : "bg-card border border-border/40 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Anything else? (optional)</label>
                  <Textarea
                    value={data.additionalNote}
                    onChange={(e) => setData((prev) => ({ ...prev, additionalNote: e.target.value }))}
                    placeholder="E.g., happens after hitting a bump..."
                    className="min-h-[60px] bg-card border-border/40"
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos & Notes */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-slide-up">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Add extra detail (optional)</h2>
                <p className="text-sm text-muted-foreground">Photos and notes help with diagnosis</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Photos</label>
                  
                  {data.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-xl border border-border/40"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-dashed border-border/60 hover:border-primary/40 transition-colors cursor-pointer">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Add photos of the issue</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Describe sounds, smells, or vibrations</label>
                  <Textarea
                    value={data.description}
                    onChange={(e) => setData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="E.g., loud grinding noise from front right when braking..."
                    className="min-h-[100px] bg-card border-border/40"
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="border-t border-border/20 bg-background/95 backdrop-blur-sm p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step === 4 && (
            <Button
              variant="outline"
              onClick={handleNext}
              className="flex-1 border-border/40"
            >
              Skip for now
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 btn-glow bg-primary hover:bg-primary/90"
          >
            {step === 4 ? "Get diagnosis" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitCrewWizard;

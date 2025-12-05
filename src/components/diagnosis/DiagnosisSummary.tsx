import { AlertTriangle, CheckCircle, XOctagon, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export type SafetyLevel = "safe" | "caution" | "critical";

export interface DiagnosisResult {
  likelyCauses: { cause: string; probability: "high" | "medium" | "low" }[];
  safetyLevel: SafetyLevel;
  nextActions: string[];
  mechanicSummary: string;
}

interface DiagnosisSummaryProps {
  result: DiagnosisResult;
  symptom: string;
  vehicleInfo?: string;
}

const DiagnosisSummary = ({ result, symptom, vehicleInfo }: DiagnosisSummaryProps) => {
  const { toast } = useToast();

  const safetyConfig = {
    safe: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "Safe to Drive",
      bgClass: "bg-diagnosis-success/10",
      borderClass: "border-diagnosis-success/30",
      textClass: "text-diagnosis-success",
    },
    caution: {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Drive with Caution",
      bgClass: "bg-diagnosis-warning/10",
      borderClass: "border-diagnosis-warning/30",
      textClass: "text-diagnosis-warning",
    },
    critical: {
      icon: <XOctagon className="w-5 h-5" />,
      label: "Do Not Drive",
      bgClass: "bg-diagnosis-danger/10",
      borderClass: "border-diagnosis-danger/30",
      textClass: "text-diagnosis-danger",
    },
  };

  const safety = safetyConfig[result.safetyLevel];

  const handleCopy = async () => {
    const text = `Vehicle Diagnosis Summary
${vehicleInfo ? `Vehicle: ${vehicleInfo}\n` : ""}Symptom: ${symptom}

Likely Causes:
${result.likelyCauses.map((c, i) => `${i + 1}. ${c.cause} (${c.probability} probability)`).join("\n")}

Safety Level: ${safety.label}

Recommended Actions:
${result.nextActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Summary for Mechanic:
${result.mechanicSummary}`;

    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Summary ready to share with your mechanic",
    });
  };

  return (
    <div className="space-y-4 animate-fade-slide-up">
      <h3 className="text-lg font-semibold text-foreground">Diagnosis Complete</h3>

      {/* Safety Badge */}
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border",
          safety.bgClass,
          safety.borderClass
        )}
      >
        <div className={safety.textClass}>{safety.icon}</div>
        <div>
          <div className={cn("font-semibold", safety.textClass)}>{safety.label}</div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result.safetyLevel === "safe" && "Your vehicle appears safe for normal driving."}
            {result.safetyLevel === "caution" && "Drive carefully and get this checked soon."}
            {result.safetyLevel === "critical" && "Avoid driving. Get immediate inspection."}
          </p>
        </div>
      </div>

      {/* Likely Causes */}
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="font-medium text-foreground mb-3">Likely Causes</h4>
        <div className="space-y-2">
          {result.likelyCauses.map((cause, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                  cause.probability === "high" && "bg-diagnosis-danger",
                  cause.probability === "medium" && "bg-diagnosis-warning",
                  cause.probability === "low" && "bg-muted-foreground"
                )}
              />
              <div>
                <p className="text-sm text-foreground">{cause.cause}</p>
                <span
                  className={cn(
                    "text-xs",
                    cause.probability === "high" && "text-diagnosis-danger",
                    cause.probability === "medium" && "text-diagnosis-warning",
                    cause.probability === "low" && "text-muted-foreground"
                  )}
                >
                  {cause.probability} probability
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions */}
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="font-medium text-foreground mb-3">Recommended Actions</h4>
        <ol className="space-y-2">
          {result.nextActions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className="text-primary font-medium">{idx + 1}.</span>
              <span className="text-foreground">{action}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Mechanic Summary */}
      <div className="bg-secondary/30 rounded-xl border border-border/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Summary for Mechanic</h4>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-primary hover:text-primary/80"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.mechanicSummary}
        </p>
      </div>

      {/* Share Button */}
      <Button onClick={handleCopy} className="w-full" variant="outline">
        <Share2 className="w-4 h-4 mr-2" />
        Share Diagnosis Summary
      </Button>
    </div>
  );
};

export default DiagnosisSummary;

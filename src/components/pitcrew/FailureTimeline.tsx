import { AlertTriangle, CheckCircle, Clock, HelpCircle, Shield, XCircle } from "lucide-react";
import { FailureRisk } from "./types";
import { cn } from "@/lib/utils";

interface FailureTimelineProps {
  risks: FailureRisk[];
  inputStrength: number;
}

const FailureTimeline = ({ risks, inputStrength }: FailureTimelineProps) => {
  const getRiskIcon = (level: FailureRisk["riskLevel"]) => {
    switch (level) {
      case "high":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const getRiskBorderColor = (level: FailureRisk["riskLevel"]) => {
    switch (level) {
      case "high":
        return "border-l-red-400";
      case "medium":
        return "border-l-yellow-400";
      default:
        return "border-l-green-400";
    }
  };

  const getCanItWaitBadge = (canWait: FailureRisk["canItWait"]) => {
    switch (canWait) {
      case "no":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
            <Clock className="w-3 h-3" />
            Needs attention soon
          </span>
        );
      case "maybe":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            <HelpCircle className="w-3 h-3" />
            Monitor closely
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
            <CheckCircle className="w-3 h-3" />
            Can wait
          </span>
        );
    }
  };

  // Sort by risk level (high first)
  const sortedRisks = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  return (
    <div className="space-y-4">
      {/* Confidence indicator */}
      <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl">
        <Shield className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm text-foreground">
            Prediction confidence based on input quality
          </p>
          <p className="text-xs text-muted-foreground">
            Input strength: {inputStrength}%
          </p>
        </div>
      </div>

      {/* Risk Cards */}
      <div className="space-y-3">
        {sortedRisks.map((risk, index) => (
          <div
            key={index}
            className={cn(
              "bg-card/50 rounded-xl p-4 border-l-4 space-y-3 animate-fade-slide-up",
              getRiskBorderColor(risk.riskLevel)
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getRiskIcon(risk.riskLevel)}
                <div>
                  <h4 className="font-medium text-foreground">{risk.component}</h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {risk.riskLevel} risk • {risk.confidence}% confidence
                  </p>
                </div>
              </div>
              {getCanItWaitBadge(risk.canItWait)}
            </div>

            {/* Estimated Window */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated window:</span>
              <span className="text-foreground font-medium">{risk.estimatedWindow}</span>
            </div>

            {/* Reasoning */}
            <p className="text-sm text-muted-foreground">{risk.reasoning}</p>

            {/* Preventive Action */}
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Preventive action</p>
              <p className="text-sm text-foreground">{risk.preventiveAction}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground/70 text-center p-4 bg-secondary/20 rounded-xl">
        <p>
          Predictions are risk-based estimates, not guarantees. Always consult a
          qualified mechanic for final diagnosis.
        </p>
      </div>
    </div>
  );
};

export default FailureTimeline;

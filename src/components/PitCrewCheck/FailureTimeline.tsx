import { RiskPrediction, PredictionResult } from "./types";
import { AlertTriangle, CheckCircle, Clock, Shield, Info, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FailureTimelineProps {
  result: PredictionResult;
}

const RiskCard = ({ prediction, index }: { prediction: RiskPrediction; index: number }) => {
  const getRiskColor = () => {
    switch (prediction.riskLevel) {
      case "high":
        return "border-destructive/50 bg-destructive/5";
      case "medium":
        return "border-yellow-500/50 bg-yellow-500/5";
      case "low":
        return "border-green-500/50 bg-green-500/5";
    }
  };

  const getRiskBadge = () => {
    switch (prediction.riskLevel) {
      case "high":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            High Risk
          </span>
        );
      case "medium":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Medium Risk
          </span>
        );
      case "low":
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" />
            Low Risk
          </span>
        );
    }
  };

  return (
    <div 
      className={cn("rounded-2xl border p-4 space-y-3 animate-fade-slide-up", getRiskColor())}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{prediction.component}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {prediction.timeWindow}
          </p>
        </div>
        {getRiskBadge()}
      </div>

      <p className="text-sm text-muted-foreground">{prediction.reason}</p>

      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  prediction.confidence >= 80 ? "bg-green-500" :
                  prediction.confidence >= 60 ? "bg-yellow-500" : "bg-muted-foreground"
                )}
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
            <span className="text-xs text-foreground font-medium">{prediction.confidence}%</span>
          </div>
        </div>
        
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          prediction.canWait
            ? "text-green-500 bg-green-500/10"
            : "text-destructive bg-destructive/10"
        )}>
          {prediction.canWait ? "Can wait" : "Address soon"}
        </span>
      </div>

      {/* Preventive action */}
      <div className="bg-secondary/30 rounded-xl p-3 flex items-start gap-2">
        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Recommended Action</span>
          <p className="text-sm text-foreground">{prediction.preventiveAction}</p>
        </div>
      </div>
    </div>
  );
};

const FailureTimeline = ({ result }: FailureTimelineProps) => {
  const highRiskCount = result.predictions.filter(p => p.riskLevel === "high").length;
  const mediumRiskCount = result.predictions.filter(p => p.riskLevel === "medium").length;
  const lowRiskCount = result.predictions.filter(p => p.riskLevel === "low").length;

  // Sort predictions: high -> medium -> low
  const sortedPredictions = [...result.predictions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="card-vignette p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Failure Risk Timeline</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">{result.vehicleSummary}</p>
        
        {/* Risk summary badges */}
        <div className="flex items-center flex-wrap gap-3 pt-2">
          {highRiskCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-destructive bg-destructive/10 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              {highRiskCount} high risk
            </span>
          )}
          {mediumRiskCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              {mediumRiskCount} medium risk
            </span>
          )}
          {lowRiskCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4" />
              {lowRiskCount} low risk
            </span>
          )}
          {result.predictions.length === 0 && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="w-4 h-4" />
              No immediate concerns detected
            </span>
          )}
        </div>

        {/* Input strength indicator */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/20">
          <span className="text-xs text-muted-foreground">Analysis based on:</span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            result.inputStrength === "strong" && "text-green-500 bg-green-500/10",
            result.inputStrength === "medium" && "text-yellow-500 bg-yellow-500/10",
            result.inputStrength === "weak" && "text-destructive bg-destructive/10"
          )}>
            {result.inputScore}% input strength ({result.inputStrength})
          </span>
        </div>
      </div>

      {/* Timeline of predictions */}
      {sortedPredictions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground px-1">Risk Predictions</h4>
          {sortedPredictions.map((prediction, idx) => (
            <RiskCard key={prediction.component + idx} prediction={prediction} index={idx} />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-xl">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {result.disclaimer}
        </p>
      </div>
    </div>
  );
};

export default FailureTimeline;

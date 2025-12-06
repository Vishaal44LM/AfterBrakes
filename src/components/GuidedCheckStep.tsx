import { useState } from "react";
import { Check, SkipForward, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StepStatus = "pending" | "done" | "skipped" | "cantdo";

interface GuidedCheckStepProps {
  stepNumber: number;
  title: string;
  content: string;
  status: StepStatus;
  onStatusChange: (status: StepStatus) => void;
  disabled?: boolean;
}

const GuidedCheckStep = ({
  stepNumber,
  title,
  content,
  status,
  onStatusChange,
  disabled,
}: GuidedCheckStepProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case "done":
        return "border-green-500/40 bg-green-500/5";
      case "skipped":
        return "border-muted-foreground/30 bg-muted/20 opacity-60";
      case "cantdo":
        return "border-orange-500/40 bg-orange-500/5";
      default:
        return "border-border/40";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "done":
        return <Check className="w-4 h-4 text-green-500" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-muted-foreground" />;
      case "cantdo":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <span className="text-sm text-muted-foreground font-medium">{stepNumber}</span>;
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 transition-all ${getStatusStyles()}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
            status === "done"
              ? "border-green-500/40 bg-green-500/10"
              : status === "cantdo"
              ? "border-orange-500/40 bg-orange-500/10"
              : "border-border/40 bg-card"
          }`}
        >
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-2">{title}</h4>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content}
          </div>

          {status === "pending" && !disabled && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange("done")}
                className="rounded-full border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Done
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange("skipped")}
                className="rounded-full border-muted-foreground/30 text-muted-foreground hover:bg-muted/20"
              >
                <SkipForward className="w-3.5 h-3.5 mr-1.5" />
                Skip
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange("cantdo")}
                className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
              >
                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                Can't do
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuidedCheckStep;

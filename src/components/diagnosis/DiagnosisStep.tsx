import { useState } from "react";
import { Check, SkipForward, XCircle, Eye, Ear, Camera, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "done" | "skipped" | "cant-do";
export type StepType = "safety" | "visual" | "listen" | "interaction" | "photo" | "workshop";

export interface DiagnosisStepData {
  id: number;
  title: string;
  purpose: string;
  instructions: string[];
  type: StepType;
  followUpQuestion?: string;
}

interface DiagnosisStepProps {
  step: DiagnosisStepData;
  status: StepStatus;
  isActive: boolean;
  isUpcoming: boolean;
  onStatusChange: (status: StepStatus, followUpAnswer?: string) => void;
}

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  safety: <Car className="w-4 h-4" />,
  visual: <Eye className="w-4 h-4" />,
  listen: <Ear className="w-4 h-4" />,
  interaction: <Car className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  workshop: <Car className="w-4 h-4" />,
};

const DiagnosisStep = ({ step, status, isActive, isUpcoming, onStatusChange }: DiagnosisStepProps) => {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);

  const handleDone = () => {
    if (step.followUpQuestion && !showFollowUp) {
      setShowFollowUp(true);
    } else {
      onStatusChange("done", followUpAnswer || undefined);
      setShowFollowUp(false);
    }
  };

  const handleFollowUpAnswer = (answer: string) => {
    setFollowUpAnswer(answer);
    onStatusChange("done", answer);
    setShowFollowUp(false);
  };

  if (isUpcoming && !isActive) {
    return (
      <div className="px-4 py-3 bg-card/30 rounded-xl border border-border/20 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{step.id}</span>
          </div>
          <span className="text-sm text-muted-foreground">Coming up: {step.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        isActive && "bg-card border-primary/40 shadow-lg shadow-primary/10",
        status === "done" && "bg-card/50 border-diagnosis-success/30",
        status === "skipped" && "bg-card/30 border-border/20 opacity-70",
        status === "cant-do" && "bg-card/50 border-diagnosis-warning/30",
        !isActive && status === "pending" && "bg-card/50 border-border/30"
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              status === "done" && "bg-diagnosis-success/20 text-diagnosis-success",
              status === "skipped" && "bg-muted text-muted-foreground",
              status === "cant-do" && "bg-diagnosis-warning/20 text-diagnosis-warning",
              status === "pending" && isActive && "bg-primary/20 text-primary",
              status === "pending" && !isActive && "bg-muted/50 text-muted-foreground"
            )}
          >
            {status === "done" ? (
              <Check className="w-4 h-4" />
            ) : status === "skipped" ? (
              <SkipForward className="w-3 h-3" />
            ) : status === "cant-do" ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <span className="text-xs font-medium">{step.id}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Step {step.id}</span>
              <span className="text-muted-foreground">·</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                "bg-secondary/50 text-muted-foreground"
              )}>
                {stepTypeIcons[step.type]}
                {step.type === "visual" && "Visual check"}
                {step.type === "listen" && "Listen"}
                {step.type === "safety" && "Safety"}
                {step.type === "interaction" && "Interaction"}
                {step.type === "photo" && "Photo/Video"}
                {step.type === "workshop" && "Workshop prep"}
              </span>
            </div>
            <h3 className={cn(
              "font-medium",
              status === "skipped" && "text-muted-foreground line-through"
            )}>
              {step.title}
            </h3>
          </div>
        </div>

        {/* Content - only show when active or completed */}
        {(isActive || status !== "pending") && (
          <>
            <p className="text-sm text-muted-foreground mb-3 ml-11">
              {step.purpose}
            </p>

            <ul className="space-y-2 ml-11 mb-4">
              {step.instructions.map((instruction, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>

            {/* Follow-up question */}
            {showFollowUp && step.followUpQuestion && (
              <div className="ml-11 mb-4 p-3 bg-secondary/30 rounded-lg border border-border/30">
                <p className="text-sm text-foreground mb-3">{step.followUpQuestion}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFollowUpAnswer("Yes")}
                    className="text-xs"
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFollowUpAnswer("No")}
                    className="text-xs"
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFollowUpAnswer("Not sure")}
                    className="text-xs"
                  >
                    Not sure
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons - only show when active */}
            {isActive && status === "pending" && !showFollowUp && (
              <div className="flex flex-wrap gap-2 ml-11">
                <Button
                  size="sm"
                  onClick={handleDone}
                  className="bg-diagnosis-success/20 hover:bg-diagnosis-success/30 text-diagnosis-success border border-diagnosis-success/30"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("skipped")}
                  className="text-muted-foreground"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange("cant-do")}
                  className="text-diagnosis-warning border-diagnosis-warning/30 hover:bg-diagnosis-warning/10"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Can't do
                </Button>
              </div>
            )}

            {/* Status badges for completed steps */}
            {status === "done" && (
              <div className="ml-11 flex items-center gap-2 text-diagnosis-success text-sm">
                <Check className="w-4 h-4" />
                <span>Completed</span>
                {followUpAnswer && (
                  <span className="text-muted-foreground">— {followUpAnswer}</span>
                )}
              </div>
            )}
            {status === "skipped" && (
              <div className="ml-11 text-muted-foreground text-sm">Skipped</div>
            )}
            {status === "cant-do" && (
              <div className="ml-11 flex items-center gap-2 text-diagnosis-warning text-sm">
                <XCircle className="w-4 h-4" />
                <span>Couldn't complete</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DiagnosisStep;

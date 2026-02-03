import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import FailureTimeline from "./FailureTimeline";
import { FailureRisk } from "./types";

interface PitCrewHistoryResultsProps {
  risks: FailureRisk[];
  inputStrength: number;
  overallAssessment: string;
  onBack: () => void;
  onStartNew: () => void;
}

const PitCrewHistoryResults = ({
  risks,
  inputStrength,
  overallAssessment,
  onBack,
  onStartNew,
}: PitCrewHistoryResultsProps) => {
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
            <h2 className="text-lg font-semibold text-foreground">{overallAssessment}</h2>
            <p className="text-sm text-muted-foreground">
              {risks.length} potential risk{risks.length !== 1 ? "s" : ""} identified
            </p>
            <p className="text-xs text-muted-foreground/60">From vehicle history</p>
          </div>

          {/* Failure Timeline */}
          <FailureTimeline risks={risks} inputStrength={inputStrength} />

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={onStartNew} className="w-full btn-glow">
              Run new check
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitCrewHistoryResults;

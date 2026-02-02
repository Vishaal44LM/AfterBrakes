import { Shield, ChevronRight, Activity } from "lucide-react";

interface PitCrewCheckCardProps {
  onStart: () => void;
}

const PitCrewCheckCard = ({ onStart }: PitCrewCheckCardProps) => {
  return (
    <div 
      onClick={onStart}
      className="card-vignette p-5 md:p-6 cursor-pointer hover:bg-secondary/30 transition-all group animate-fade-slide-up"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground font-brand">Pit Crew Check</h2>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Predict failure risks before they happen
          </p>
        </div>
      </div>

      {/* Feature bullets */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground/70 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          Structured input analysis
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          Confidence-scored predictions
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          Failure timeline
        </span>
      </div>

      {/* Visual indicator */}
      <div className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
        <Activity className="w-4 h-4 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Input-gated predictions</span>
          </div>
          <p className="text-xs text-muted-foreground/60">
            Complete structured inputs to unlock accurate failure risk predictions
          </p>
        </div>
      </div>
    </div>
  );
};

export default PitCrewCheckCard;

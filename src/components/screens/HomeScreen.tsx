import { Shield, ChevronRight, MessageCircle } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";

interface HomeScreenProps {
  vehicle: Vehicle | null;
  onOpenGarage: () => void;
  onStartDiagnose: () => void;
  onStartTalk: () => void;
}

const HomeScreen = ({ vehicle, onOpenGarage, onStartDiagnose, onStartTalk }: HomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col px-4 pb-24">
      {/* Vehicle Info */}
      <div className="py-4 text-center">
        <button
          onClick={onOpenGarage}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/40 hover:border-primary/30 transition-all"
        >
          {vehicle ? (
            <span className="text-sm text-foreground">
              {vehicle.manufacturer} {vehicle.model} · {vehicle.year}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Select vehicle</span>
          )}
        </button>
      </div>

      {/* Primary Core Action: Pit Crew Check */}
      <div className="mt-4">
        <button
          onClick={onStartDiagnose}
          className="w-full p-6 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all group text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Pit Crew Check</h2>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Predict failure risks before they happen
              </p>
            </div>
          </div>

          {/* Visual hint */}
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              Structured input analysis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              Failure timeline
            </span>
          </div>
        </button>
      </div>

      {/* Secondary Core Action: Pit Lane Talk */}
      <div className="mt-4">
        <button
          onClick={onStartTalk}
          className="w-full p-4 rounded-xl bg-secondary/30 border border-border/20 hover:border-primary/30 transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-foreground">Pit Lane Talk</h3>
              <p className="text-xs text-muted-foreground">
                Ask anything about your car
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </button>
      </div>

      {/* Minimal Status Line */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground/50">
          Your automotive AI assistant
        </p>
      </div>
    </div>
  );
};

export default HomeScreen;

import { UsageBehaviorInputs } from "./types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Car, Route, Mountain, Users } from "lucide-react";

interface StepUsageBehaviorProps {
  data: UsageBehaviorInputs;
  onChange: (data: UsageBehaviorInputs) => void;
}

const drivingStyles = [
  { id: "calm", label: "Calm", desc: "Smooth acceleration & braking" },
  { id: "normal", label: "Normal", desc: "Average driving" },
  { id: "aggressive", label: "Spirited", desc: "Quick acceleration, hard braking" },
] as const;

const roadConditions = [
  { id: "smooth", label: "Smooth", icon: "🛣️" },
  { id: "mixed", label: "Mixed", icon: "🛤️" },
  { id: "rough", label: "Rough", icon: "🚧" },
] as const;

const loadPatterns = [
  { id: "solo", label: "Solo", desc: "Usually alone" },
  { id: "passengers", label: "Family", desc: "Frequent passengers" },
  { id: "heavy", label: "Heavy", desc: "Cargo/heavy loads" },
] as const;

const StepUsageBehavior = ({ data, onChange }: StepUsageBehaviorProps) => {
  return (
    <div className="space-y-6">
      {/* Average daily distance slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm text-foreground">
            <Route className="w-4 h-4 text-muted-foreground" />
            Average Daily Distance
          </Label>
          <span className="text-sm font-medium text-primary">
            {data.avgDailyDistance} km
          </span>
        </div>
        <Slider
          value={[data.avgDailyDistance]}
          onValueChange={(value) => onChange({ ...data, avgDailyDistance: value[0] })}
          max={200}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 km</span>
          <span>100 km</span>
          <span>200 km</span>
        </div>
      </div>

      {/* Driving style */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          <Car className="w-4 h-4 text-muted-foreground" />
          Driving Style
          <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {drivingStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onChange({ ...data, drivingStyle: style.id })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.drivingStyle === style.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-border"
              }`}
            >
              <span className="block text-sm font-medium">{style.label}</span>
              <span className="block text-xs opacity-70 mt-0.5 line-clamp-1">{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Road conditions */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          <Mountain className="w-4 h-4 text-muted-foreground" />
          Typical Road Conditions
          <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {roadConditions.map((condition) => (
            <button
              key={condition.id}
              onClick={() => onChange({ ...data, roadCondition: condition.id })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.roadCondition === condition.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-border"
              }`}
            >
              <span className="text-lg">{condition.icon}</span>
              <span className="block text-sm font-medium mt-1">{condition.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Load pattern */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          <Users className="w-4 h-4 text-muted-foreground" />
          Typical Load
          <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {loadPatterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => onChange({ ...data, loadPattern: pattern.id })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.loadPattern === pattern.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-border"
              }`}
            >
              <span className="block text-sm font-medium">{pattern.label}</span>
              <span className="block text-xs opacity-70 mt-0.5">{pattern.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepUsageBehavior;

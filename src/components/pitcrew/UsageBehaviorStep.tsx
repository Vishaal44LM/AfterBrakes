import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UsageBehaviorInputs } from "./types";

interface UsageBehaviorStepProps {
  data: UsageBehaviorInputs;
  onChange: (data: UsageBehaviorInputs) => void;
}

const UsageBehaviorStep = ({ data, onChange }: UsageBehaviorStepProps) => {
  return (
    <div className="space-y-8">
      {/* Average Daily Distance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Average daily distance</Label>
          <span className="text-sm font-medium text-primary">{data.averageDailyDistance} km</span>
        </div>
        <Slider
          value={[data.averageDailyDistance]}
          onValueChange={([value]) => onChange({ ...data, averageDailyDistance: value })}
          min={5}
          max={200}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 km</span>
          <span>200 km</span>
        </div>
      </div>

      {/* Driving Style */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Driving style</Label>
        <RadioGroup
          value={data.drivingStyle}
          onValueChange={(value) =>
            onChange({ ...data, drivingStyle: value as UsageBehaviorInputs["drivingStyle"] })
          }
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "calm", label: "Calm", emoji: "🐢", desc: "Gentle acceleration" },
            { value: "normal", label: "Normal", emoji: "🚗", desc: "Balanced driving" },
            { value: "aggressive", label: "Spirited", emoji: "🏎️", desc: "Quick acceleration" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${
                data.drivingStyle === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-sm text-foreground font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground text-center mt-0.5">{option.desc}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Road Condition */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Typical road conditions</Label>
        <RadioGroup
          value={data.roadCondition}
          onValueChange={(value) =>
            onChange({ ...data, roadCondition: value as UsageBehaviorInputs["roadCondition"] })
          }
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "smooth", label: "Smooth", emoji: "✨" },
            { value: "mixed", label: "Mixed", emoji: "🛤️" },
            { value: "rough", label: "Rough", emoji: "🚧" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${
                data.roadCondition === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Load Pattern */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Typical load</Label>
        <RadioGroup
          value={data.loadPattern}
          onValueChange={(value) =>
            onChange({ ...data, loadPattern: value as UsageBehaviorInputs["loadPattern"] })
          }
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "solo", label: "Solo", emoji: "👤" },
            { value: "passengers", label: "Family", emoji: "👨‍👩‍👧" },
            { value: "heavy", label: "Heavy", emoji: "📦" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${
                data.loadPattern === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

export default UsageBehaviorStep;

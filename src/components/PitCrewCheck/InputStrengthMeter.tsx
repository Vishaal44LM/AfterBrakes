import { InputStrength } from "./types";
import { cn } from "@/lib/utils";
import { Lock, Unlock } from "lucide-react";

interface InputStrengthMeterProps {
  score: number;
  strength: InputStrength;
  threshold?: number;
  className?: string;
}

const InputStrengthMeter = ({ score, strength, threshold = 70, className }: InputStrengthMeterProps) => {
  const isUnlocked = score >= threshold;

  const getStrengthColor = () => {
    switch (strength) {
      case "weak":
        return "bg-destructive";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-green-500" />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
          Input Strength
        </span>
        <span className={cn(
          "font-medium",
          strength === "weak" && "text-destructive",
          strength === "medium" && "text-yellow-500",
          strength === "strong" && "text-green-500"
        )}>
          {getStrengthLabel()} ({score}%)
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
        <div
          className={cn("h-full transition-all duration-500", getStrengthColor())}
          style={{ width: `${score}%` }}
        />
        {/* Threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
          style={{ left: `${threshold}%` }}
        />
      </div>
      {strength === "weak" && (
        <p className="text-xs text-muted-foreground">
          Complete more details to unlock predictions (need {threshold - score}% more)
        </p>
      )}
      {strength === "medium" && (
        <p className="text-xs text-green-500">
          ✓ Predictions unlocked! Add more details for higher accuracy.
        </p>
      )}
      {strength === "strong" && (
        <p className="text-xs text-green-500">
          ✓ Excellent! High confidence predictions available.
        </p>
      )}
    </div>
  );
};

export default InputStrengthMeter;

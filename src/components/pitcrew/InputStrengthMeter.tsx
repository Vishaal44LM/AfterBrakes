import { cn } from "@/lib/utils";

interface InputStrengthMeterProps {
  score: number;
  className?: string;
}

const InputStrengthMeter = ({ score, className }: InputStrengthMeterProps) => {
  const getStrengthLabel = () => {
    if (score >= 70) return "Strong";
    if (score >= 40) return "Medium";
    return "Weak";
  };

  const getStrengthColor = () => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Input Strength</span>
        <span className={cn("text-xs font-medium", getTextColor())}>
          {getStrengthLabel()} ({score}%)
        </span>
      </div>
      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 ease-out", getStrengthColor())}
          style={{ width: `${score}%` }}
        />
      </div>
      {score < 70 && (
        <p className="text-xs text-muted-foreground/70">
          Complete more fields to unlock predictions
        </p>
      )}
    </div>
  );
};

export default InputStrengthMeter;

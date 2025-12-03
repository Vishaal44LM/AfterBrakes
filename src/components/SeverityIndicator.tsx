import { Shield, AlertTriangle, OctagonX } from "lucide-react";

export type SeverityLevel = "safe" | "caution" | "danger" | null;

interface SeverityIndicatorProps {
  severity: SeverityLevel;
}

const severityConfig = {
  safe: {
    label: "Safe to drive",
    icon: Shield,
    className: "text-muted-foreground",
  },
  caution: {
    label: "Drive with caution",
    icon: AlertTriangle,
    className: "text-primary",
  },
  danger: {
    label: "Do not drive",
    icon: OctagonX,
    className: "text-foreground font-medium",
  },
};

const SeverityIndicator = ({ severity }: SeverityIndicatorProps) => {
  if (!severity) return null;

  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-full bg-background/30 border border-border/20 w-fit shadow-sm shadow-primary/10">
      <Icon className={`w-3 h-3 ${config.className}`} />
      <span className={`text-xs ${config.className}`}>{config.label}</span>
    </div>
  );
};

export default SeverityIndicator;

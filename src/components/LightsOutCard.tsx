import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

const LightsOutCard = () => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/lights-out")}
      className="card-vignette p-4 cursor-pointer hover:bg-secondary/40 transition-colors animate-fade-slide-up group"
      style={{ animationDelay: "150ms" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mini gantry lights preview */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-destructive/80 group-hover:animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Lights Out</h3>
            <p className="text-xs text-muted-foreground">Test your reaction time</p>
          </div>
        </div>
        <Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
      </div>
    </div>
  );
};

export default LightsOutCard;

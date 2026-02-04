import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LightsOutCard from "@/components/LightsOutCard";
import CarTriviaSnack from "@/components/CarTriviaSnack";

interface SideQuestsScreenProps {
  onBack: () => void;
}

const SideQuestsScreen = ({ onBack }: SideQuestsScreenProps) => {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-secondary/30 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground/80">Between Drives</span>
        </div>

        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground mb-6">
          Quick challenges and tips while you're not at the wheel
        </p>

        <div className="space-y-4">
          <LightsOutCard />
          <CarTriviaSnack />
        </div>
      </div>
    </div>
  );
};

export default SideQuestsScreen;

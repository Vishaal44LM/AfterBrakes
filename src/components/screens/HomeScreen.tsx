import { Shield, MessageCircle, Car, History, Gamepad2 } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import logo from "@/assets/logo.png";

interface HomeScreenProps {
  vehicle: Vehicle | null;
  onOpenGarage: () => void;
  onStartDiagnose: () => void;
  onStartTalk: () => void;
  onOpenHistory: () => void;
  onOpenSideQuests: () => void;
}

const HomeScreen = ({ 
  vehicle, 
  onOpenGarage, 
  onStartDiagnose, 
  onStartTalk,
  onOpenHistory,
  onOpenSideQuests
}: HomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-screen relative">
      {/* Edge-placed secondary access - top corners */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/30 transition-all text-sm"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>
        
        <button
          onClick={onOpenGarage}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-secondary/30 transition-all text-sm"
        >
          <Car className="w-4 h-4" />
          <span className="hidden sm:inline">Garage</span>
        </button>
      </div>

      {/* Side quests - deeply de-emphasized, bottom corner */}
      <button
        onClick={onOpenSideQuests}
        className="absolute bottom-4 right-4 p-2 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/20 transition-all"
        title="Explore"
      >
        <Gamepad2 className="w-4 h-4" />
      </button>

      {/* Centered content container */}
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* 1. Brand Identity Anchor */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="After Brakes" className="w-16 h-16 mb-3" />
          <h1 className="text-xl font-semibold text-foreground font-brand tracking-tight">
            After Brakes
          </h1>
        </div>

        {/* 2. Vehicle Context - subtle centered pill */}
        <button
          onClick={onOpenGarage}
          className="mb-12 px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {vehicle ? (
            <span>
              {vehicle.manufacturer} {vehicle.model} · {vehicle.year}
            </span>
          ) : (
            <span className="text-muted-foreground/60">Select a vehicle</span>
          )}
        </button>

        {/* 3. Primary Intelligence Action - Pit Crew Check */}
        <button
          onClick={onStartDiagnose}
          className="w-full mb-4 p-8 rounded-3xl bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-card/80 transition-all group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Pit Crew Check
            </h2>
            <p className="text-sm text-muted-foreground/70">
              Predict failure risks before they happen
            </p>
          </div>
        </button>

        {/* 4. Secondary Intelligence Action - Pit Lane Talk */}
        <button
          onClick={onStartTalk}
          className="w-full p-5 rounded-2xl hover:bg-secondary/20 transition-all group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center mb-3 group-hover:bg-secondary/50 transition-colors">
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground/80 mb-0.5">
              Pit Lane Talk
            </h3>
            <p className="text-xs text-muted-foreground/60">
              Ask anything about your car
            </p>
          </div>
        </button>

      </div>
    </div>
  );
};

export default HomeScreen;

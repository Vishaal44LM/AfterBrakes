import { Shield, MessageCircle, Car, History, Zap, HelpCircle, LogOut } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import { useOrbDrag, DragDirection } from "@/hooks/useOrbDrag";
import logo from "@/assets/logo.png";

interface HomeScreenProps {
  vehicle: Vehicle | null;
  onOpenGarage: () => void;
  onStartDiagnose: () => void;
  onStartTalk: () => void;
  onOpenHistory: () => void;
  onOpenSideQuests: () => void;
  onOpenLightsOut?: () => void;
  onOpenDriveTimeQA?: () => void;
  onLogout?: () => void;
}

const DIRECTION_MAP: Record<string, { label: string; icon: typeof Shield; hint: string }> = {
  up: { label: "Pit Crew Check", icon: Shield, hint: "Predict risks" },
  down: { label: "Pit Lane Talk", icon: MessageCircle, hint: "Ask anything" },
  left: { label: "Lights Out", icon: Zap, hint: "Reaction game" },
  right: { label: "Drive Time Q&A", icon: HelpCircle, hint: "Quiz mode" },
};

const HomeScreen = ({
  vehicle,
  onOpenGarage,
  onStartDiagnose,
  onStartTalk,
  onOpenHistory,
  onOpenLightsOut,
  onOpenDriveTimeQA,
  onLogout,
}: HomeScreenProps) => {
  const handleNavigate = (direction: DragDirection) => {
    if (!direction) return;
    switch (direction) {
      case "up":
        onStartDiagnose();
        break;
      case "down":
        onStartTalk();
        break;
      case "left":
        onOpenLightsOut?.();
        break;
      case "right":
        onOpenDriveTimeQA?.();
        break;
    }
  };

  const { isDragging, offset, lockedDirection, dragProgress, orbHandlers } =
    useOrbDrag({ threshold: 60, maxDrag: 120, onNavigate: handleNavigate });

  const getDirectionIndicatorStyle = (dir: string) => {
    const isActive = lockedDirection === dir;
    const isLocked = dragProgress >= 1 && isActive;
    const baseOpacity = isDragging ? (isActive ? 0.15 + dragProgress * 0.6 : 0.04) : 0.06;

    return {
      opacity: baseOpacity,
      transform: isLocked ? "scale(1.08)" : isActive ? `scale(${1 + dragProgress * 0.06})` : "scale(1)",
      transition: isDragging ? "opacity 0.1s, transform 0.1s" : "all 0.4s cubic-bezier(0.4,0,0.2,1)",
    };
  };

  const getDirectionLabelStyle = (dir: string) => {
    const isActive = lockedDirection === dir;
    const opacity = isDragging ? (isActive ? 0.4 + dragProgress * 0.6 : 0.15) : 0.5;
    return {
      opacity,
      transform: isActive && dragProgress >= 1 ? "scale(1.05)" : "scale(1)",
      transition: isDragging ? "opacity 0.1s, transform 0.1s" : "all 0.4s ease",
    };
  };

  const orbStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const glowIntensity = isDragging ? 0.15 + dragProgress * 0.35 : 0.1;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden select-none">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-drift" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-drift-delayed" />

      {/* Logout - Top Right */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="absolute top-6 right-6 z-30 opacity-40 hover:opacity-100 transition-opacity"
          title="Sign out"
        >
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-secondary/20 transition-colors">
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Logout</span>
          </div>
        </button>
      )}

      {/* Main centered layout */}
      <div className="relative h-full flex items-center justify-center">

        {/* Directional zone indicators */}
        {/* UP - Pit Crew Check */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[8%] sm:top-[12%] flex flex-col items-center gap-2 pointer-events-none"
          style={getDirectionLabelStyle("up")}
        >
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/30 blur-2xl absolute -z-10"
            style={getDirectionIndicatorStyle("up")}
          />
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <span className="text-sm sm:text-base font-semibold text-foreground">Pit Crew Check</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground/60">Slide up</span>
        </div>

        {/* DOWN - Pit Lane Talk */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[8%] sm:bottom-[12%] flex flex-col items-center gap-2 pointer-events-none"
          style={getDirectionLabelStyle("down")}
        >
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/30 blur-2xl absolute -z-10"
            style={getDirectionIndicatorStyle("down")}
          />
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-secondary/40 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/80" />
          </div>
          <span className="text-sm sm:text-base font-medium text-foreground/90">Pit Lane Talk</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground/50">Slide down</span>
        </div>

        {/* LEFT - Lights Out */}
        <div
          className="absolute left-[6%] sm:left-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={getDirectionLabelStyle("left")}
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/30 blur-2xl absolute -z-10"
            style={getDirectionIndicatorStyle("left")}
          />
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground/60">Lights Out</span>
        </div>

        {/* RIGHT - Drive Time Q&A */}
        <div
          className="absolute right-[6%] sm:right-[15%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none"
          style={getDirectionLabelStyle("right")}
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/30 blur-2xl absolute -z-10"
            style={getDirectionIndicatorStyle("right")}
          />
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground/60">Drive Time Q&A</span>
        </div>

        {/* Direction lock beam */}
        {isDragging && lockedDirection && dragProgress >= 0.5 && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5"
            style={{
              width: lockedDirection === "left" || lockedDirection === "right" ? `${dragProgress * 180}px` : "2px",
              height: lockedDirection === "up" || lockedDirection === "down" ? `${dragProgress * 180}px` : "2px",
              background: `linear-gradient(${
                lockedDirection === "up" ? "to top" :
                lockedDirection === "down" ? "to bottom" :
                lockedDirection === "left" ? "to left" : "to right"
              }, hsl(var(--primary) / ${dragProgress * 0.5}), transparent)`,
              transformOrigin: "center",
              transition: "width 0.1s, height 0.1s",
            }}
          />
        )}

        {/* Utility tiles - Garage & History */}
        <button
          onClick={onOpenGarage}
          className="absolute left-[6%] sm:left-[15%] bottom-[18%] sm:bottom-[24%] z-20 orbital-tile orbital-tile-compact"
        >
          <div className="orbital-tile-inner w-20 h-20 sm:w-24 sm:h-24"
            style={{ opacity: isDragging ? 0.3 : 1, transition: "opacity 0.3s" }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/30 flex items-center justify-center mb-1.5">
              <Car className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground/70">Garage</span>
          </div>
        </button>

        <button
          onClick={onOpenHistory}
          className="absolute right-[6%] sm:right-[15%] bottom-[18%] sm:bottom-[24%] z-20 orbital-tile orbital-tile-compact"
        >
          <div className="orbital-tile-inner w-20 h-20 sm:w-24 sm:h-24"
            style={{ opacity: isDragging ? 0.3 : 1, transition: "opacity 0.3s" }}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/30 flex items-center justify-center mb-1.5">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground/70">History</span>
          </div>
        </button>

        {/* ===== CENTER ORB ===== */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div style={orbStyle}>
            {/* Animated glow ring */}
            <div
              className="absolute inset-0 -m-6 rounded-full blur-xl transition-opacity"
              style={{
                background: `radial-gradient(circle, hsl(var(--primary) / ${glowIntensity}), transparent 70%)`,
                opacity: 1,
              }}
            />
            <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl animate-pulse-slow" />

            {/* Orb body */}
            <div
              {...orbHandlers}
              className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-card via-card to-secondary/50 border border-border/30 flex flex-col items-center justify-center shadow-2xl touch-none"
              style={{
                boxShadow: `0 0 ${20 + dragProgress * 40}px hsl(var(--primary) / ${0.1 + dragProgress * 0.25}), var(--shadow-elevated)`,
              }}
            >
              <img src={logo} alt="After Brakes" className="w-14 h-14 sm:w-16 sm:h-16 mb-1 pointer-events-none" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground pointer-events-none">
                After Brakes
              </span>
              {vehicle && (
                <span className="text-[10px] sm:text-xs text-muted-foreground/50 mt-0.5 pointer-events-none">
                  {vehicle.manufacturer} {vehicle.model}
                </span>
              )}

              {/* Drag hint */}
              {!isDragging && (
                <span className="absolute -bottom-8 text-[10px] text-muted-foreground/30 animate-pulse-slow pointer-events-none whitespace-nowrap">
                  Drag to navigate
                </span>
              )}

              {/* Active direction label */}
              {isDragging && lockedDirection && dragProgress >= 0.6 && (
                <div className="absolute -bottom-10 flex flex-col items-center pointer-events-none animate-fade-in">
                  <span className="text-xs font-semibold text-primary">
                    {DIRECTION_MAP[lockedDirection]?.label}
                  </span>
                  {dragProgress >= 1 && (
                    <span className="text-[10px] text-primary/60 mt-0.5">Release to open</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

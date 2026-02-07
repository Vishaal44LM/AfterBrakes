import { useMemo } from "react";
import { Shield, MessageCircle, Car, History, Zap, HelpCircle, LogOut } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";
import { useRadialDrag, RadialNodeId, getNodePosition } from "@/hooks/useRadialDrag";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface RadialNodeConfig {
  id: RadialNodeId;
  label: string;
  hint: string;
  icon: typeof Shield;
  angle: number;
  priority: "core" | "standard" | "utility";
}

const RADIAL_NODES: RadialNodeConfig[] = [
  { id: "pit-crew", label: "Pit Crew Check", hint: "Predict risks", icon: Shield, angle: 0, priority: "core" },
  { id: "drive-time", label: "Drive Time Q&A", hint: "Quiz mode", icon: HelpCircle, angle: 60, priority: "standard" },
  { id: "history", label: "Vehicle History", hint: "Past sessions", icon: History, angle: 120, priority: "utility" },
  { id: "pit-lane", label: "Pit Lane Talk", hint: "Ask anything", icon: MessageCircle, angle: 180, priority: "core" },
  { id: "garage", label: "Garage", hint: "Your vehicles", icon: Car, angle: 240, priority: "utility" },
  { id: "lights-out", label: "Lights Out", hint: "Reaction game", icon: Zap, angle: 300, priority: "standard" },
];

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
  const isMobile = useIsMobile();
  const orbitRadius = isMobile ? 125 : 170;

  const handleNavigate = (nodeId: RadialNodeId) => {
    const actions: Record<RadialNodeId, () => void> = {
      "pit-crew": onStartDiagnose,
      "drive-time": () => onOpenDriveTimeQA?.(),
      "history": onOpenHistory,
      "pit-lane": onStartTalk,
      "garage": onOpenGarage,
      "lights-out": () => onOpenLightsOut?.(),
    };
    actions[nodeId]?.();
  };

  const { isDragging, offset, activeNodeId, dragProgress, orbHandlers } = useRadialDrag({
    threshold: 70,
    maxDrag: orbitRadius * 0.7,
    deadzone: 15,
    onNavigate: handleNavigate,
  });

  const nodePositions = useMemo(
    () => RADIAL_NODES.map((node) => ({
      ...node,
      pos: getNodePosition(node.angle, orbitRadius),
    })),
    [orbitRadius]
  );

  /** Size classes based on node priority */
  const getNodeSizeClasses = (priority: string) => {
    switch (priority) {
      case "core":
        return "w-16 h-16 sm:w-20 sm:h-20";
      case "standard":
        return "w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem]";
      case "utility":
        return "w-13 h-13 sm:w-16 sm:h-16";
      default:
        return "w-14 h-14 sm:w-16 sm:h-16";
    }
  };

  const getIconSize = (priority: string) => {
    switch (priority) {
      case "core":
        return "w-6 h-6 sm:w-7 sm:h-7";
      case "standard":
        return "w-5 h-5 sm:w-6 sm:h-6";
      default:
        return "w-4 h-4 sm:w-5 sm:h-5";
    }
  };

  /** Compute visual state for each node */
  const getNodeStyle = (node: RadialNodeConfig) => {
    const isActive = activeNodeId === node.id;
    const isCore = node.priority === "core";

    if (!isDragging) {
      return {
        scale: 1,
        opacity: 1,
        glowOpacity: isCore ? 0.12 : 0.06,
        labelOpacity: 0.7,
      };
    }

    if (isActive) {
      return {
        scale: 1 + dragProgress * 0.15,
        opacity: 1,
        glowOpacity: 0.2 + dragProgress * 0.5,
        labelOpacity: 0.5 + dragProgress * 0.5,
      };
    }

    // Non-active nodes fade based on progress
    return {
      scale: 1 - dragProgress * 0.05,
      opacity: Math.max(0.25, 1 - dragProgress * 0.6),
      glowOpacity: 0.02,
      labelOpacity: Math.max(0.15, 0.7 - dragProgress * 0.55),
    };
  };

  /** Directional glow from orb toward active node */
  const getDirectionalGlow = () => {
    if (!isDragging || !activeNodeId || dragProgress < 0.3) return null;
    const activeNode = RADIAL_NODES.find((n) => n.id === activeNodeId);
    if (!activeNode) return null;

    const rad = activeNode.angle * (Math.PI / 180);
    const glowX = Math.sin(rad);
    const glowY = -Math.cos(rad);

    return {
      background: `radial-gradient(ellipse at ${50 + glowX * 35}% ${50 + glowY * 35}%, hsl(var(--primary) / ${dragProgress * 0.35}), transparent 70%)`,
    };
  };

  const orbStyle = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const glowIntensity = isDragging ? 0.15 + dragProgress * 0.4 : 0.12;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden select-none">
      {/* Background ambience */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-drift" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-drift-delayed" />

      {/* Logout — top right */}
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

      {/* Radial container — centered */}
      <div className="absolute inset-0 flex items-center justify-center">

        {/* Directional glow overlay */}
        {getDirectionalGlow() && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={getDirectionalGlow()!}
          />
        )}

        {/* Connection lines from center to each node */}
        <svg
          className="absolute pointer-events-none"
          style={{ width: orbitRadius * 2 + 80, height: orbitRadius * 2 + 80 }}
          viewBox={`${-(orbitRadius + 40)} ${-(orbitRadius + 40)} ${(orbitRadius + 40) * 2} ${(orbitRadius + 40) * 2}`}
        >
          {nodePositions.map((node) => {
            const isActive = activeNodeId === node.id;
            const lineOpacity = isDragging
              ? isActive
                ? 0.15 + dragProgress * 0.35
                : 0.03
              : 0.06;

            return (
              <line
                key={node.id}
                x1={offset.x}
                y1={offset.y}
                x2={node.pos.x}
                y2={node.pos.y}
                stroke={`hsl(var(--primary))`}
                strokeWidth={isActive && isDragging ? 1.5 : 0.5}
                opacity={lineOpacity}
                strokeDasharray={isActive && isDragging && dragProgress >= 0.8 ? "none" : "4 4"}
                style={{ transition: isDragging ? "opacity 0.1s" : "all 0.4s ease" }}
              />
            );
          })}
        </svg>

        {/* ===== RADIAL NODES ===== */}
        {nodePositions.map((node) => {
          const Icon = node.icon;
          const vs = getNodeStyle(node);
          const isActive = activeNodeId === node.id;

          return (
            <button
              key={node.id}
              onClick={() => handleNavigate(node.id)}
              className="absolute z-10 flex flex-col items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
              style={{
                transform: `translate(${node.pos.x}px, ${node.pos.y}px) scale(${vs.scale})`,
                opacity: vs.opacity,
                transition: isDragging
                  ? "transform 0.1s ease-out, opacity 0.1s ease-out"
                  : "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Glow halo behind node */}
              <div
                className="absolute -inset-3 rounded-full blur-xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle, hsl(var(--primary) / ${vs.glowOpacity}), transparent 70%)`,
                  transition: isDragging ? "background 0.1s" : "background 0.4s ease",
                }}
              />

              {/* Node circle */}
              <div
                className={`${getNodeSizeClasses(node.priority)} rounded-full flex items-center justify-center relative
                  ${node.priority === "core"
                    ? "bg-card/80 border border-primary/25"
                    : node.priority === "utility"
                    ? "bg-secondary/30 border border-border/20"
                    : "bg-card/60 border border-border/25"
                  }`}
                style={{
                  boxShadow: isActive && isDragging
                    ? `0 0 ${20 + dragProgress * 30}px hsl(var(--primary) / ${0.15 + dragProgress * 0.35})`
                    : node.priority === "core"
                    ? "0 0 20px hsl(var(--primary) / 0.1)"
                    : "none",
                  transition: isDragging ? "box-shadow 0.1s" : "box-shadow 0.4s ease",
                }}
              >
                <Icon className={`${getIconSize(node.priority)} ${
                  node.priority === "core" ? "text-primary" :
                  node.priority === "utility" ? "text-muted-foreground" :
                  "text-accent"
                }`} />
              </div>

              {/* Label */}
              <span
                className={`text-center leading-tight pointer-events-none whitespace-nowrap
                  ${node.priority === "core" ? "text-xs sm:text-sm font-semibold text-foreground" :
                    node.priority === "utility" ? "text-[10px] sm:text-xs font-medium text-foreground/70" :
                    "text-[11px] sm:text-xs font-medium text-foreground/80"
                  }`}
                style={{ opacity: vs.labelOpacity, transition: isDragging ? "opacity 0.1s" : "opacity 0.4s ease" }}
              >
                {node.label}
              </span>

              {/* Hint text — shown when active during drag */}
              {isActive && isDragging && dragProgress >= 0.5 && (
                <span className="text-[10px] text-primary/70 animate-fade-in pointer-events-none">
                  {node.hint}
                </span>
              )}
            </button>
          );
        })}

        {/* ===== CENTER ORB ===== */}
        <div className="absolute z-20" style={orbStyle}>
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 -m-6 rounded-full blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, hsl(var(--primary) / ${glowIntensity}), transparent 70%)`,
            }}
          />
          <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl animate-pulse-slow pointer-events-none" />

          {/* Orb body */}
          <div
            {...orbHandlers}
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-card via-card to-secondary/50 border border-border/30 flex flex-col items-center justify-center shadow-2xl touch-none"
            style={{
              boxShadow: `0 0 ${20 + dragProgress * 40}px hsl(var(--primary) / ${0.1 + dragProgress * 0.25}), var(--shadow-elevated)`,
            }}
          >
            <img
              src={logo}
              alt="After Brakes"
              className="w-11 h-11 sm:w-14 sm:h-14 mb-0.5 pointer-events-none"
            />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground pointer-events-none">
              After Brakes
            </span>
            {vehicle && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/50 mt-0.5 pointer-events-none truncate max-w-[90%] text-center">
                {vehicle.manufacturer} {vehicle.model}
              </span>
            )}

            {/* Idle hint */}
            {!isDragging && (
              <span className="absolute -bottom-7 text-[10px] text-muted-foreground/30 animate-pulse-slow pointer-events-none whitespace-nowrap">
                Drag or tap to navigate
              </span>
            )}

            {/* Active direction label on drag */}
            {isDragging && activeNodeId && dragProgress >= 0.7 && (
              <div className="absolute -bottom-9 flex flex-col items-center pointer-events-none animate-fade-in">
                <span className="text-xs font-semibold text-primary">
                  {RADIAL_NODES.find((n) => n.id === activeNodeId)?.label}
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
  );
};

export default HomeScreen;

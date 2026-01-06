import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";

type GameState = "idle" | "sequence" | "waiting" | "reaction" | "result" | "false-start";

const F1LightsOutGame = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [lights, setLights] = useState<boolean[]>([false, false, false, false, false]);
  const [reactionTime, setReactionTime] = useState<string>("00:00:000");
  const [bestTime, setBestTime] = useState<string | null>(() => {
    return localStorage.getItem("f1-best-reaction-time");
  });
  
  const lightsOutTimeRef = useRef<number>(0);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SWIPE_DISTANCE = 80;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(milliseconds).padStart(3, "0")}`;
  };

  const resetGame = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setLights([false, false, false, false, false]);
    setReactionTime("00:00:000");
    setGameState("idle");
    lightsOutTimeRef.current = 0;
  }, []);

  const startSequence = useCallback(() => {
    setGameState("sequence");
    setReactionTime("00:00:000");
    
    // Turn on lights one by one (500ms intervals)
    for (let i = 0; i < 5; i++) {
      const timeout = setTimeout(() => {
        setLights(prev => {
          const newLights = [...prev];
          newLights[i] = true;
          return newLights;
        });
      }, i * 500);
      timeoutRefs.current.push(timeout);
    }

    // After all lights are on, wait random delay then turn off
    const allLightsOnTime = 5 * 500;
    const randomDelay = 1000 + Math.random() * 2000; // 1000-3000ms

    const waitTimeout = setTimeout(() => {
      setGameState("waiting");
    }, allLightsOnTime);
    timeoutRefs.current.push(waitTimeout);

    const lightsOutTimeout = setTimeout(() => {
      setLights([false, false, false, false, false]);
      lightsOutTimeRef.current = performance.now();
      setGameState("reaction");
    }, allLightsOnTime + randomDelay);
    timeoutRefs.current.push(lightsOutTimeout);
  }, []);

  const handleTap = useCallback(() => {
    if (gameState === "sequence" || gameState === "waiting") {
      // False start
      setGameState("false-start");
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
      setLights([false, false, false, false, false]);
      setReactionTime("00:00:000");
      
      // Reset after showing false start for 2 seconds
      const resetTimeout = setTimeout(() => {
        setGameState("idle");
      }, 2000);
      timeoutRefs.current.push(resetTimeout);
    } else if (gameState === "reaction") {
      // Valid reaction
      const reaction = performance.now() - lightsOutTimeRef.current;
      const formattedTime = formatTime(reaction);
      setReactionTime(formattedTime);
      setGameState("result");

      // Update best time
      if (!bestTime || reaction < parseTimeToMs(bestTime)) {
        setBestTime(formattedTime);
        localStorage.setItem("f1-best-reaction-time", formattedTime);
      }

      // Allow restart after delay
      const resetTimeout = setTimeout(() => {
        setGameState("idle");
      }, 3000);
      timeoutRefs.current.push(resetTimeout);
    }
  }, [gameState, bestTime]);

  const parseTimeToMs = (timeStr: string): number => {
    const [min, sec, ms] = timeStr.split(":").map(Number);
    return min * 60000 + sec * 1000 + ms;
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== "idle") return;
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== "idle" || !swipeStartRef.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - swipeStartRef.current.x;
    
    if (deltaX >= MIN_SWIPE_DISTANCE) {
      startSequence();
    }
    swipeStartRef.current = null;
  };

  // Mouse swipe for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState !== "idle") return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (gameState !== "idle" || !swipeStartRef.current) return;
    
    const deltaX = e.clientX - swipeStartRef.current.x;
    
    if (deltaX >= MIN_SWIPE_DISTANCE) {
      startSequence();
    }
    swipeStartRef.current = null;
  };

  const handleContainerClick = () => {
    if (gameState === "sequence" || gameState === "waiting" || gameState === "reaction") {
      handleTap();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full panel-floating p-4 touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleContainerClick}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-label text-muted-foreground tracking-widest mb-1">
          LIGHTS OUT
        </h3>
        <p className="text-xs text-muted-foreground/70">
          Test your reaction time
        </p>
      </div>

      {/* F1 Gantry */}
      <div className="relative mx-auto w-full max-w-xs">
        {/* Top bar */}
        <div className="bg-zinc-900 h-4 rounded-t-lg" />
        
        {/* Light housings container */}
        <div className="bg-zinc-900 flex justify-center gap-1.5 pb-2 px-2">
          {lights.map((isOn, index) => (
            <div
              key={index}
              className="bg-zinc-800 rounded-b-lg p-1.5 flex flex-col gap-1.5"
            >
              {/* Two lights per housing - top always off, bottom is the active one */}
              <div
                className="w-7 h-7 rounded-full transition-all duration-100"
                style={{
                  backgroundColor: isOn ? "#ef4444" : "#3f3f46",
                  boxShadow: isOn ? "0 0 20px #ef4444, 0 0 40px #ef444480" : "none"
                }}
              />
              <div
                className="w-7 h-7 rounded-full transition-all duration-100"
                style={{
                  backgroundColor: isOn ? "#ef4444" : "#3f3f46",
                  boxShadow: isOn ? "0 0 20px #ef4444, 0 0 40px #ef444480" : "none"
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Flash effect when lights go out */}
      {gameState === "reaction" && (
        <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none rounded-3xl" />
      )}

      {/* Reaction Time Display */}
      <div className="text-center mt-6 mb-4">
        <div 
          className="text-3xl font-mono font-bold tracking-wider"
          style={{ 
            color: gameState === "false-start" ? "#ef4444" : 
                   gameState === "result" ? "hsl(var(--primary))" : 
                   "hsl(var(--foreground))"
          }}
        >
          {gameState === "false-start" ? "FALSE START" : reactionTime}
        </div>
        
        {bestTime && gameState === "idle" && (
          <div className="text-xs text-muted-foreground mt-1">
            Best: {bestTime}
          </div>
        )}
      </div>

      {/* Swipe to Start / Status */}
      <div className="text-center">
        {gameState === "idle" && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
            <span className="text-sm">Swipe to start</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
        {(gameState === "sequence" || gameState === "waiting") && (
          <div className="text-xs text-muted-foreground/50">
            Tap anywhere when lights go out
          </div>
        )}
        {gameState === "result" && (
          <div className="text-xs text-muted-foreground">
            Great reaction!
          </div>
        )}
      </div>
    </div>
  );
};

export default F1LightsOutGame;

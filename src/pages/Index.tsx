import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Car, FolderOpen } from "lucide-react";
import HistoryDrawer from "@/components/HistoryDrawer";
import GaragePill from "@/components/GaragePill";
import GarageSelector from "@/components/GarageSelector";
import PitCrewCheckCard from "@/components/pitcrew/PitCrewCheckCard";
import PitCrewCheckWizard from "@/components/pitcrew/PitCrewCheckWizard";
import PitLaneTalk from "@/components/PitLaneTalk";
import Glovebox from "@/components/Glovebox";
import GloveboxBanner from "@/components/GloveboxBanner";
import CarTriviaSnack from "@/components/CarTriviaSnack";
import LightsOutCard from "@/components/LightsOutCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import logo from "@/assets/logo.png";

type AppMode = "home" | "pitcrew" | "chat" | "glovebox";

interface ChatSession {
  messages: any[];
  chatId: string | null;
  prefillMessage?: string;
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>("home");
  const [showGarageSelector, setShowGarageSelector] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession>({
    messages: [],
    chatId: null,
    prefillMessage: undefined
  });

  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const {
    vehicles,
    activeVehicle,
    setActiveVehicle,
    refresh: refreshVehicles
  } = useVehicles(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (vehicleToast) {
      const timer = setTimeout(() => setVehicleToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [vehicleToast]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setVehicleToast(`Now diagnosing: ${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`);
  };

  const handleStartPitCrewCheck = () => {
    setMode("pitcrew");
  };

  const handleOpenChat = (prefillMessage?: string) => {
    setChatSession({
      messages: [],
      chatId: null,
      prefillMessage
    });
    setMode("chat");
  };

  const handleOpenGlovebox = () => {
    setMode("glovebox");
  };

  const handleBack = () => {
    setMode("home");
    setChatSession({
      messages: [],
      chatId: null,
      prefillMessage: undefined
    });
  };

  // Load chat from history - opens Pit Lane Talk with existing messages
  const handleLoadChat = (loadedMessages: any[], chatId: string) => {
    setChatSession({
      messages: loadedMessages,
      chatId
    });
    setMode("chat");
  };

  // Load check from history - for now just show in chat
  const handleLoadCheck = (loadedMessages: any[], chatId: string) => {
    // Parse the stored data and show in chat mode for now
    setChatSession({
      messages: loadedMessages,
      chatId
    });
    setMode("chat");
  };

  const handleNewChat = () => {
    setChatSession({
      messages: [],
      chatId: null
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <img src={logo} alt="After Brakes" className="w-24 h-24 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative">
      <div className="seam-line absolute top-0 left-0 right-0" />

      {/* Header - only show on home */}
      {mode === "home" && (
        <>
          <header className="flex items-center justify-between px-4 py-3 mx-4 mt-4 mb-2 panel-floating">
            {/* Left: Logo and title */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="After Brakes" className="w-8 h-8" />
              <h1 className="text-base font-semibold text-foreground font-brand">
                After Brakes
              </h1>
            </div>

            {/* Right: History, Garage, Logout icons */}
            <div className="flex items-center gap-1">
              <HistoryDrawer onLoadChat={handleLoadChat} onLoadCheck={handleLoadCheck} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGarageSelector(true)}
                className="btn-glow hover:bg-secondary/50 transition-smooth"
                title="Your Garage"
              >
                <Car className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="btn-glow hover:bg-secondary/50 transition-smooth"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
          </header>

          {/* Vehicle pill with last activity */}
          <div className="px-4 mb-3">
            <GaragePill
              vehicle={activeVehicle}
              onClick={() => setShowGarageSelector(true)}
              className="text-center"
            />
            {/* Last activity status line */}
            <button 
              onClick={() => setShowHistoryDrawer(true)}
              className="w-full text-center mt-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Tap to view vehicle history
            </button>
          </div>

          {/* Glovebox banner for expiring documents */}
          {user && (
            <GloveboxBanner 
              userId={user.id} 
              onView={handleOpenGlovebox} 
            />
          )}
        </>
      )}

      {/* Vehicle toast notification */}
      {vehicleToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-card border border-primary/30 rounded-full shadow-lg shadow-primary/20 animate-fade-slide-up">
          <span className="text-sm text-foreground">{vehicleToast}</span>
        </div>
      )}

      {/* Main content based on mode */}
      {mode === "home" && (
        <div className="flex-1 flex flex-col items-center pt-2 md:pt-6 overflow-y-auto pb-8">
          <div className="w-full max-w-2xl mx-auto px-4 space-y-6">
            
            {/* CORE ZONE: Pit Crew Check Card */}
            <div className="space-y-4">
              <PitCrewCheckCard onStart={handleStartPitCrewCheck} />
              
              {/* Pit Lane Talk link */}
              <div className="flex items-center justify-center py-2 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
                <span className="text-sm text-muted-foreground">Just have a quick question?</span>
                <button
                  onClick={() => handleOpenChat()}
                  className="ml-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Open Pit Lane Talk →
                </button>
              </div>
            </div>

            {/* UTILITY ZONE: Glovebox */}
            <div className="pt-2">
              <div 
                onClick={handleOpenGlovebox}
                className="card-vignette p-4 cursor-pointer hover:bg-secondary/40 transition-colors animate-fade-slide-up group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Glovebox</h3>
                      <p className="text-xs text-muted-foreground">Saved checks, PDFs & documents</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground/60">→</span>
                </div>
              </div>
            </div>

            {/* FUN ZONE: Between drives */}
            <div className="pt-4 space-y-3">
              {/* Section header */}
              <div className="px-1">
                <h2 className="text-sm font-medium text-foreground/80">Between drives</h2>
                <p className="text-xs text-muted-foreground/50">Quick challenges and tips while you're not at the wheel</p>
              </div>

              {/* Fun cards - reduced height */}
              <div className="space-y-3">
                <LightsOutCard />
                <CarTriviaSnack />
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "pitcrew" && user && (
        <PitCrewCheckWizard
          vehicle={activeVehicle}
          userId={user.id}
          onBack={handleBack}
          onOpenChat={handleOpenChat}
          onComplete={handleBack}
        />
      )}

      {mode === "chat" && user && (
        <PitLaneTalk
          vehicle={activeVehicle}
          userId={user.id}
          initialMessages={chatSession.messages}
          chatId={chatSession.chatId}
          onBack={handleBack}
          onStartGuidedCheck={() => {
            setMode("pitcrew");
          }}
          onNewChat={handleNewChat}
          prefillMessage={chatSession.prefillMessage}
        />
      )}

      {mode === "glovebox" && user && (
        <Glovebox
          userId={user.id}
          onBack={handleBack}
        />
      )}

      <div className="seam-line absolute bottom-0 left-0 right-0" />

      {/* Modals */}
      {showGarageSelector && user && (
        <GarageSelector
          vehicles={vehicles}
          activeVehicle={activeVehicle}
          onSelect={handleSelectVehicle}
          onClose={() => setShowGarageSelector(false)}
          onRefresh={refreshVehicles}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Index;

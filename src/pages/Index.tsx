import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, FolderOpen } from "lucide-react";
import HistoryDrawer from "@/components/HistoryDrawer";
import GaragePill from "@/components/GaragePill";
import GarageSelector from "@/components/GarageSelector";
import PitCrewCheck from "@/components/PitCrewCheck";
import PitCrewWizard from "@/components/PitCrewWizard";
import GuidedDiagnosis from "@/components/GuidedDiagnosis";
import PitLaneTalk from "@/components/PitLaneTalk";
import Glovebox from "@/components/Glovebox";
import GloveboxBanner from "@/components/GloveboxBanner";
import CarTriviaSnack from "@/components/CarTriviaSnack";
import LightsOutCard from "@/components/LightsOutCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import logo from "@/assets/logo.png";

type AppMode = "home" | "wizard" | "guided" | "chat" | "glovebox";

interface GuidedSession {
  symptom: string;
  images: string[];
  fromHistory?: boolean;
  historyMessages?: any[];
  chatId?: string;
}

interface ChatSession {
  messages: any[];
  chatId: string | null;
  prefillMessage?: string;
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>("home");
  const [showGarageSelector, setShowGarageSelector] = useState(false);
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);
  const [guidedSession, setGuidedSession] = useState<GuidedSession | null>(null);
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

  const handleStartWizard = () => {
    setMode("wizard");
  };

  const handleStartGuidedCheck = (symptom: string, images: string[] = []) => {
    if (symptom.trim() || images.length > 0) {
      setGuidedSession({
        symptom,
        images,
        fromHistory: false
      });
      setMode("guided");
    }
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
    setGuidedSession(null);
    setChatSession({
      messages: [],
      chatId: null,
      prefillMessage: undefined
    });
  };

  const handleStartNewCheck = () => {
    setGuidedSession(null);
    setMode("home");
  };

  // Load chat from history - opens Pit Lane Talk with existing messages
  const handleLoadChat = (loadedMessages: any[], chatId: string) => {
    setChatSession({
      messages: loadedMessages,
      chatId
    });
    setMode("chat");
  };

  // Load check from history - opens Pit Crew Check (Guided Diagnosis) with existing data
  const handleLoadCheck = (loadedMessages: any[], chatId: string) => {
    // Extract the original symptom from the first user message
    const userMessage = loadedMessages.find(m => m.role === "user");
    const symptom = userMessage?.content || "";
    
    setGuidedSession({
      symptom,
      images: userMessage?.images || [],
      fromHistory: true,
      historyMessages: loadedMessages,
      chatId
    });
    setMode("guided");
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
            <div className="flex items-center gap-2">
              <HistoryDrawer onLoadChat={handleLoadChat} onLoadCheck={handleLoadCheck} />
            </div>

            <div className="flex items-center gap-2">
              <img src={logo} alt="After Brakes" className="w-8 h-8" />
              <h1 className="text-base font-semibold text-foreground font-brand">
                After Brakes
              </h1>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenGlovebox}
                className="btn-glow hover:bg-secondary/50 transition-smooth"
                title="Glovebox"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="btn-glow hover:bg-secondary/50 transition-smooth"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Vehicle pill */}
          <div className="px-4 mb-2">
            <GaragePill
              vehicle={activeVehicle}
              onClick={() => setShowGarageSelector(true)}
              className="text-center"
            />
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
        <div className="flex-1 flex flex-col items-center pt-4 md:pt-8 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
            <PitCrewCheck
              onSubmit={handleStartGuidedCheck}
              disabled={false}
              onOpenChat={() => handleOpenChat()}
            />

            {/* Lights Out Game Card */}
            <LightsOutCard />

            {/* Drive Time Q&A */}
            <CarTriviaSnack />
          </div>
        </div>
      )}

      {mode === "wizard" && user && (
        <PitCrewWizard
          vehicle={activeVehicle}
          userId={user.id}
          onBack={handleBack}
          onOpenChat={handleOpenChat}
          onComplete={handleBack}
        />
      )}

      {mode === "guided" && guidedSession && user && (
        <GuidedDiagnosis
          symptom={guidedSession.symptom}
          images={guidedSession.images}
          vehicle={activeVehicle}
          userId={user.id}
          onBack={handleBack}
          onOpenChat={() => handleOpenChat()}
          onStartNewCheck={handleStartNewCheck}
          fromHistory={guidedSession.fromHistory}
          historyMessages={guidedSession.historyMessages}
          chatId={guidedSession.chatId}
        />
      )}

      {mode === "chat" && user && (
        <PitLaneTalk
          vehicle={activeVehicle}
          userId={user.id}
          initialMessages={chatSession.messages}
          chatId={chatSession.chatId}
          onBack={handleBack}
          onStartGuidedCheck={(symptom) => handleStartGuidedCheck(symptom)}
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import logo from "@/assets/logo.png";

// Screen components
import HomeScreen from "@/components/screens/HomeScreen";
import SideQuestsScreen from "@/components/screens/SideQuestsScreen";

// Feature components
import HistoryDrawer from "@/components/HistoryDrawer";
import GarageSelector from "@/components/GarageSelector";
import PitCrewCheckWizard from "@/components/pitcrew/PitCrewCheckWizard";
import PitCrewHistoryResults from "@/components/pitcrew/PitCrewHistoryResults";
import PitLaneTalk from "@/components/PitLaneTalk";
 import LightsOutCard from "@/components/LightsOutCard";
 import CarTriviaSnack from "@/components/CarTriviaSnack";

 type NavTab = "home" | "diagnose" | "talk" | "lights-out" | "drive-time-qa";

interface ChatSession {
  messages: any[];
  chatId: string | null;
  prefillMessage?: string;
}

interface PitCrewHistoryResult {
  risks: any[];
  inputStrength: number;
  overallAssessment: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [showGarageSelector, setShowGarageSelector] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession>({
    messages: [],
    chatId: null,
    prefillMessage: undefined
  });
  const [pitCrewHistory, setPitCrewHistory] = useState<PitCrewHistoryResult | null>(null);
  const [showPitCrewResults, setShowPitCrewResults] = useState(false);

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

  const handleTabChange = (tab: NavTab) => {
    // Reset states when changing tabs
    setChatSession({ messages: [], chatId: null, prefillMessage: undefined });
    setPitCrewHistory(null);
    setShowPitCrewResults(false);
    setActiveTab(tab);
  };

  const handleOpenChat = (prefillMessage?: string) => {
    setChatSession({
      messages: [],
      chatId: null,
      prefillMessage
    });
    setActiveTab("talk");
  };

  const handleBackToHome = () => {
    setChatSession({ messages: [], chatId: null, prefillMessage: undefined });
    setPitCrewHistory(null);
    setShowPitCrewResults(false);
    setActiveTab("home");
  };

  // Load chat from history - opens Pit Lane Talk with existing messages
  const handleLoadChat = (loadedMessages: any[], chatId: string) => {
    setChatSession({
      messages: loadedMessages,
      chatId
    });
    setActiveTab("talk");
  };

  // Load check from history - parse and show results view
  const handleLoadCheck = (loadedMessages: any[], chatId: string) => {
    const assistantMsg = loadedMessages.find((m: any) => m.role === "assistant");
    if (assistantMsg?.content) {
      try {
        const data = JSON.parse(assistantMsg.content);
        if (data.type === "pit-crew-check" && data.risks) {
          setPitCrewHistory({
            risks: data.risks,
            inputStrength: data.inputStrength || 70,
            overallAssessment: data.overallAssessment || "Risk analysis from history"
          });
          setShowPitCrewResults(true);
          setActiveTab("diagnose");
          return;
        }
      } catch {
        // Not JSON, fallback to chat
      }
    }
    setChatSession({ messages: loadedMessages, chatId });
    setActiveTab("talk");
  };

  const handleNewChat = () => {
    setChatSession({
      messages: [],
      chatId: null
    });
  };

  const handleDiagnoseComplete = () => {
    setActiveTab("home");
  };

  const handleStartNewCheck = () => {
    setPitCrewHistory(null);
    setShowPitCrewResults(false);
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

  // Pit Crew History Results view
  if (showPitCrewResults && pitCrewHistory) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PitCrewHistoryResults
          risks={pitCrewHistory.risks}
          inputStrength={pitCrewHistory.inputStrength}
          overallAssessment={pitCrewHistory.overallAssessment}
          onBack={handleBackToHome}
          onStartNew={handleStartNewCheck}
        />
      </div>
    );
  }

  return (
     <div className="relative min-h-screen bg-background">
      {/* Vehicle toast notification */}
      {vehicleToast && (
         <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-card border border-primary/30 rounded-full shadow-lg shadow-primary/20 animate-fade-slide-up">
          <span className="text-sm text-foreground">{vehicleToast}</span>
        </div>
      )}

       {/* Logout button - floating */}
       <Button
         variant="ghost"
         size="icon"
         onClick={signOut}
         className="fixed top-4 right-4 z-40 h-8 w-8 text-muted-foreground/30 hover:text-foreground hover:bg-secondary/30 transition-all"
         title="Sign out"
       >
         <LogOut className="w-4 h-4" />
       </Button>
 
        {activeTab === "home" && (
          <HomeScreen
            vehicle={activeVehicle}
            onOpenGarage={() => setShowGarageSelector(true)}
            onStartDiagnose={() => setActiveTab("diagnose")}
            onStartTalk={() => setActiveTab("talk")}
            onOpenHistory={() => setShowHistoryDrawer(true)}
             onOpenSideQuests={() => {}}
             onOpenLightsOut={() => setActiveTab("lights-out")}
             onOpenDriveTimeQA={() => setActiveTab("drive-time-qa")}
          />
        )}

        {activeTab === "diagnose" && user && (
          <PitCrewCheckWizard
            vehicle={activeVehicle}
            userId={user.id}
            onBack={handleBackToHome}
            onOpenChat={handleOpenChat}
            onComplete={handleDiagnoseComplete}
          />
        )}

        {activeTab === "talk" && user && (
          <PitLaneTalk
            vehicle={activeVehicle}
            userId={user.id}
            initialMessages={chatSession.messages}
            chatId={chatSession.chatId}
            onBack={handleBackToHome}
            onStartGuidedCheck={() => setActiveTab("diagnose")}
            onNewChat={handleNewChat}
            prefillMessage={chatSession.prefillMessage}
          />
        )}
 
         {activeTab === "lights-out" && (
           <div className="fixed inset-0 bg-background z-30 flex flex-col">
             <div className="flex-1 overflow-auto p-4">
               <button
                 onClick={handleBackToHome}
                 className="mb-4 text-muted-foreground hover:text-foreground transition-colors text-sm"
               >
                 ← Back
               </button>
               <LightsOutCard />
             </div>
           </div>
         )}
 
         {activeTab === "drive-time-qa" && (
           <div className="fixed inset-0 bg-background z-30 flex flex-col">
             <div className="flex-1 overflow-auto p-4">
               <button
                 onClick={handleBackToHome}
                 className="mb-4 text-muted-foreground hover:text-foreground transition-colors text-sm"
               >
                 ← Back
               </button>
               <CarTriviaSnack />
             </div>
           </div>
         )}

      {/* History Drawer */}
      <HistoryDrawer 
        isOpen={showHistoryDrawer}
        onOpenChange={setShowHistoryDrawer}
        onLoadChat={(messages, id) => {
          handleLoadChat(messages, id);
          setShowHistoryDrawer(false);
        }} 
        onLoadCheck={(messages, id) => {
          handleLoadCheck(messages, id);
          setShowHistoryDrawer(false);
        }} 
      />

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

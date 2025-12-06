import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, LogOut } from "lucide-react";
import HistoryDrawer from "@/components/HistoryDrawer";
import GaragePill from "@/components/GaragePill";
import GarageSelector from "@/components/GarageSelector";
import PitCrewCheck from "@/components/PitCrewCheck";
import GuidedDiagnosis from "@/components/GuidedDiagnosis";
import PitLaneTalk from "@/components/PitLaneTalk";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";

type AppMode = "home" | "guided" | "chat";

interface GuidedSession {
  symptom: string;
  images: string[];
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>("home");
  const [showGarageSelector, setShowGarageSelector] = useState(false);
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);
  const [guidedSession, setGuidedSession] = useState<GuidedSession | null>(null);

  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { vehicles, activeVehicle, setActiveVehicle, refresh: refreshVehicles } = useVehicles(user?.id);

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

  const handleStartGuidedCheck = (symptom: string, images: string[] = []) => {
    if (symptom.trim() || images.length > 0) {
      setGuidedSession({ symptom, images });
      setMode("guided");
    }
  };

  const handleOpenChat = () => {
    setMode("chat");
  };

  const handleBack = () => {
    setMode("home");
    setGuidedSession(null);
  };

  const handleLoadChat = (loadedMessages: any[]) => {
    // When loading from history, go to chat mode
    setMode("chat");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Car className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
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
          <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 mx-4 md:mx-6 mt-4 mb-2 panel-floating">
            <div className="flex items-center gap-2 md:gap-3">
              <HistoryDrawer onLoadChat={handleLoadChat} />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Car className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <h1 className="text-base font-semibold text-foreground font-serif md:text-xl">
                After Brakes
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="btn-glow hover:bg-secondary/50 transition-smooth"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </header>

          <div className="px-4 mb-2">
            <GaragePill
              vehicle={activeVehicle}
              onClick={() => setShowGarageSelector(true)}
              className="text-center"
            />
          </div>
        </>
      )}

      {/* Vehicle toast notification */}
      {vehicleToast && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-card border border-primary/30 rounded-full shadow-lg shadow-primary/20 animate-fade-slide-up">
          <span className="text-sm text-foreground">{vehicleToast}</span>
        </div>
      )}

      {/* Main content based on mode */}
      {mode === "home" && (
        <div className="flex-1 flex items-center justify-center px-4">
          <PitCrewCheck
            onSubmit={handleStartGuidedCheck}
            disabled={false}
            onOpenChat={handleOpenChat}
          />
        </div>
      )}

      {mode === "guided" && guidedSession && (
        <GuidedDiagnosis
          symptom={guidedSession.symptom}
          images={guidedSession.images}
          vehicle={activeVehicle}
          onBack={handleBack}
          onOpenChat={handleOpenChat}
        />
      )}

      {mode === "chat" && user && (
        <PitLaneTalk
          vehicle={activeVehicle}
          userId={user.id}
          onBack={handleBack}
          onStartGuidedCheck={(symptom) => handleStartGuidedCheck(symptom)}
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

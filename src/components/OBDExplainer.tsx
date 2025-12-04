import { useState } from "react";
import { X, Cpu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Vehicle } from "@/hooks/useVehicles";

interface OBDExplainerProps {
  vehicle: Vehicle | null;
  onSubmit: (message: string) => void;
  onClose: () => void;
  onChangeVehicle: () => void;
  onNoCode: () => void;
}

const OBDExplainer = ({ vehicle, onSubmit, onClose, onChangeVehicle, onNoCode }: OBDExplainerProps) => {
  const [obdCode, setObdCode] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const handleSubmit = () => {
    if (!obdCode.trim()) return;
    
    const vehicleInfo = vehicle 
      ? `${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}` 
      : "my vehicle";
    
    const message = symptoms.trim()
      ? `OBD code ${obdCode.toUpperCase()} for ${vehicleInfo} with symptoms: ${symptoms}`
      : `OBD code ${obdCode.toUpperCase()} for ${vehicleInfo}. Please explain what this code means.`;
    
    onSubmit(message);
    onClose();
  };

  const handleNoCode = () => {
    onNoCode();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md card-vignette p-6 animate-fade-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">OBD Code Explainer</h2>
              <p className="text-sm text-muted-foreground">Enter your diagnostic code</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="btn-glow">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">OBD Code</label>
            <Input
              value={obdCode}
              onChange={(e) => setObdCode(e.target.value)}
              placeholder="e.g. P0301, P0420"
              className="bg-card border-border/40 focus:border-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Describe what you notice</label>
            <Textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Engine shaking at idle, check engine light on…"
              className="bg-card border-border/40 focus:border-primary/50 min-h-[100px] resize-none"
            />
          </div>

          {vehicle && (
            <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/20">
              <div className="flex items-center gap-2">
                <span className="text-sm">🚗</span>
                <span className="text-sm text-foreground">
                  {vehicle.manufacturer} {vehicle.model} · {vehicle.year}
                </span>
              </div>
              <button 
                onClick={onChangeVehicle}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Change
              </button>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={!obdCode.trim()}
            className="w-full btn-glow btn-tap"
          >
            Explain this code
          </Button>

          <button 
            onClick={handleNoCode}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            What if I don't have a code?
          </button>
        </div>
      </div>
    </div>
  );
};

export default OBDExplainer;

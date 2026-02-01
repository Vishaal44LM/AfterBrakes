import { VehicleInputs } from "./types";
import { Vehicle } from "@/hooks/useVehicles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Calendar, Gauge, AlertCircle } from "lucide-react";

interface StepVehicleDetailsProps {
  vehicle: Vehicle | null;
  data: VehicleInputs;
  onChange: (data: VehicleInputs) => void;
}

const usagePatterns = [
  { id: "city", label: "City", desc: "Mostly urban traffic" },
  { id: "highway", label: "Highway", desc: "Long distance drives" },
  { id: "mixed", label: "Mixed", desc: "Both city & highway" },
] as const;

const StepVehicleDetails = ({ vehicle, data, onChange }: StepVehicleDetailsProps) => {
  const isMileageValid = data.mileage !== "" && parseInt(data.mileage) > 0;
  const isPatternValid = data.usagePattern !== "";
  const isServiceValid = data.lastServiceDate !== "" || data.lastServiceMileage !== "";

  return (
    <div className="space-y-6">
      {/* Vehicle info display */}
      {vehicle && (
        <div className="bg-secondary/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {vehicle.manufacturer} {vehicle.model}
            </p>
            <p className="text-xs text-muted-foreground">
              {vehicle.year} · {vehicle.fuel.toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {/* Mandatory fields notice */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          All fields on this page are required to unlock predictions.
        </p>
      </div>

      {/* Mileage input */}
      <div className="space-y-2">
        <Label htmlFor="mileage" className="flex items-center gap-2 text-sm text-foreground">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          Current Mileage (km)
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="mileage"
          type="number"
          placeholder="e.g., 45000"
          value={data.mileage}
          onChange={(e) => onChange({ ...data, mileage: e.target.value })}
          className={`bg-secondary/30 ${isMileageValid ? 'border-green-500/50' : 'border-border/40'}`}
        />
      </div>

      {/* Driving usage pattern */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          Primary Driving Pattern
          <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {usagePatterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => onChange({ ...data, usagePattern: pattern.id })}
              className={`p-3 rounded-xl border text-center transition-all ${
                data.usagePattern === pattern.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/40 bg-secondary/20 text-muted-foreground hover:border-border"
              }`}
            >
              <span className="block text-sm font-medium">{pattern.label}</span>
              <span className="block text-xs opacity-70 mt-0.5">{pattern.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Last service - date OR mileage */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          Last Service (date OR mileage)
          <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              type="date"
              value={data.lastServiceDate}
              onChange={(e) => onChange({ ...data, lastServiceDate: e.target.value })}
              className={`bg-secondary/30 ${data.lastServiceDate ? 'border-green-500/50' : 'border-border/40'}`}
            />
            <span className="text-xs text-muted-foreground mt-1 block">Date</span>
          </div>
          <div>
            <Input
              type="number"
              placeholder="e.g., 40000"
              value={data.lastServiceMileage}
              onChange={(e) => onChange({ ...data, lastServiceMileage: e.target.value })}
              className={`bg-secondary/30 ${data.lastServiceMileage ? 'border-green-500/50' : 'border-border/40'}`}
            />
            <span className="text-xs text-muted-foreground mt-1 block">OR Mileage (km)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepVehicleDetails;

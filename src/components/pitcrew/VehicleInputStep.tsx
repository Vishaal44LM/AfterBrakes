import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VehicleInputs } from "./types";
import { Vehicle } from "@/hooks/useVehicles";

interface VehicleInputStepProps {
  data: VehicleInputs;
  vehicle: Vehicle | null;
  onChange: (data: VehicleInputs) => void;
}

const VehicleInputStep = ({ data, vehicle, onChange }: VehicleInputStepProps) => {
  return (
    <div className="space-y-6">
      {/* Vehicle context display */}
      {vehicle && (
        <div className="bg-secondary/30 rounded-xl p-4 border border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">🚗</span>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {vehicle.manufacturer} {vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {vehicle.year} • {vehicle.fuel?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Mileage */}
      <div className="space-y-2">
        <Label htmlFor="mileage" className="text-sm font-medium">
          Current odometer reading (km) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="mileage"
          type="number"
          placeholder="e.g., 45000"
          value={data.mileage || ""}
          onChange={(e) =>
            onChange({ ...data, mileage: e.target.value ? parseInt(e.target.value) : null })
          }
          className="bg-secondary/30 border-border/30"
        />
      </div>

      {/* Usage Pattern */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Primary driving type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={data.usagePattern || ""}
          onValueChange={(value) =>
            onChange({ ...data, usagePattern: value as VehicleInputs["usagePattern"] })
          }
          className="grid grid-cols-3 gap-3"
        >
          {[
            { value: "city", label: "City", emoji: "🏙️" },
            { value: "highway", label: "Highway", emoji: "🛣️" },
            { value: "mixed", label: "Mixed", emoji: "🔀" },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-all ${
                data.usagePattern === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <RadioGroupItem value={option.value} className="sr-only" />
              <span className="text-2xl mb-1">{option.emoji}</span>
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Last Service */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">
          Last service <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serviceDate" className="text-xs text-muted-foreground">
              Date (approximate)
            </Label>
            <Input
              id="serviceDate"
              type="date"
              value={data.lastServiceDate || ""}
              onChange={(e) => onChange({ ...data, lastServiceDate: e.target.value || null })}
              className="bg-secondary/30 border-border/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceMileage" className="text-xs text-muted-foreground">
              OR mileage at service
            </Label>
            <Input
              id="serviceMileage"
              type="number"
              placeholder="e.g., 40000"
              value={data.lastServiceMileage || ""}
              onChange={(e) =>
                onChange({
                  ...data,
                  lastServiceMileage: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="bg-secondary/30 border-border/30"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleInputStep;

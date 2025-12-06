import { useState } from "react";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  fuel: "petrol" | "diesel" | "cng" | "ev";
  is_active: boolean;
}

interface GarageSelectorProps {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  onSelect: (vehicle: Vehicle) => void;
  onClose: () => void;
  onRefresh: () => void;
  userId: string;
}

const GarageSelector = ({
  vehicles,
  activeVehicle,
  onSelect,
  onClose,
  onRefresh,
  userId,
}: GarageSelectorProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuel, setFuel] = useState<"petrol" | "diesel" | "cng" | "ev">("petrol");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fuelOptions = [
    { value: "petrol", label: "Petrol" },
    { value: "diesel", label: "Diesel" },
    { value: "cng", label: "CNG" },
    { value: "ev", label: "EV" },
  ] as const;

  const handleAdd = async () => {
    const trimmedManufacturer = manufacturer.trim();
    const trimmedModel = model.trim();
    const trimmedYear = year.trim();

    if (!trimmedManufacturer || !trimmedModel || !trimmedYear) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const yearNum = parseInt(trimmedYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      toast({ title: "Please enter a valid year", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("vehicles").insert({
        user_id: userId,
        manufacturer: trimmedManufacturer,
        model: trimmedModel,
        year: yearNum,
        fuel,
        is_active: vehicles.length === 0,
      }).select().single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setManufacturer("");
      setModel("");
      setYear("");
      setFuel("petrol");
      setIsAdding(false);
      onRefresh();
      toast({ title: "Vehicle added successfully" });
      
      // Auto-select if first vehicle
      if (vehicles.length === 0 && data) {
        onSelect(data as Vehicle);
      }
    } catch (error) {
      console.error("Failed to add vehicle:", error);
      toast({ 
        title: "Failed to add vehicle", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      onRefresh();
      toast({ title: "Vehicle removed" });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Failed to remove vehicle", variant: "destructive" });
    }
  };

  const handleSelect = async (vehicle: Vehicle) => {
    try {
      // Deactivate all vehicles first
      await supabase.from("vehicles").update({ is_active: false }).eq("user_id", userId);
      // Activate selected vehicle
      await supabase.from("vehicles").update({ is_active: true }).eq("id", vehicle.id);
      onSelect({ ...vehicle, is_active: true });
      onClose();
    } catch (error) {
      console.error("Select error:", error);
      toast({ title: "Failed to select vehicle", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-card border border-border/40 rounded-2xl shadow-lg shadow-primary/10 p-4 animate-fade-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your Garage</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                activeVehicle?.id === vehicle.id
                  ? "bg-primary/10 border border-primary/30 shadow-sm shadow-primary/20"
                  : "bg-secondary/30 border border-border/20 hover:bg-secondary/50"
              }`}
              onClick={() => handleSelect(vehicle)}
            >
              <div>
                <p className="font-medium text-foreground">
                  {vehicle.manufacturer} {vehicle.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.year} · {vehicle.fuel?.toUpperCase() || "Petrol"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeVehicle?.id === vehicle.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/20"
                  onClick={(e) => handleDelete(vehicle.id, e)}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}

          {vehicles.length === 0 && !isAdding && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vehicles yet. Add your first vehicle below.
            </p>
          )}
        </div>

        {isAdding ? (
          <div className="mt-4 space-y-3 p-3 bg-secondary/30 rounded-xl border border-border/20">
            <Input
              placeholder="Manufacturer (e.g., Maruti)"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="bg-background/50"
              disabled={isLoading}
            />
            <Input
              placeholder="Model (e.g., Baleno)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-background/50"
              disabled={isLoading}
            />
            <Input
              placeholder="Year (e.g., 2018)"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-background/50"
              disabled={isLoading}
            />
            <div className="grid grid-cols-4 gap-2">
              {fuelOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFuel(option.value)}
                  disabled={isLoading}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    fuel === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Adding..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setManufacturer("");
                  setModel("");
                  setYear("");
                  setFuel("petrol");
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full mt-4 btn-glow"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add vehicle
          </Button>
        )}
      </div>
    </div>
  );
};

export default GarageSelector;

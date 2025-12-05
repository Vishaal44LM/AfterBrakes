import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
}

interface GaragePillProps {
  vehicle: Vehicle | null;
  onClick: () => void;
  className?: string;
}

const GaragePill = ({ vehicle, onClick, className }: GaragePillProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 mx-auto rounded-full bg-card border border-border/40 shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:border-primary/30 transition-all duration-200 active:scale-95",
        className
      )}
    >
      <Car className="w-4 h-4 text-primary" />
      {vehicle ? (
        <span className="text-sm text-foreground">
          {vehicle.manufacturer} {vehicle.model} · {vehicle.year}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Select vehicle</span>
      )}
    </button>
  );
};

export default GaragePill;

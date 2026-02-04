import { Car, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SecondaryNavProps {
  onOpenGarage: () => void;
  onOpenHistory: () => void;
}

const SecondaryNav = ({ onOpenGarage, onOpenHistory }: SecondaryNavProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenHistory}
        className="h-8 w-8 hover:bg-secondary/50 transition-smooth"
        title="Vehicle History"
      >
        <History className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenGarage}
        className="h-8 w-8 hover:bg-secondary/50 transition-smooth"
        title="Your Garage"
      >
        <Car className="w-4 h-4 text-muted-foreground hover:text-foreground" />
      </Button>
    </div>
  );
};

export default SecondaryNav;

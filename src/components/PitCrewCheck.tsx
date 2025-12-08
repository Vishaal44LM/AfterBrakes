import { useState } from "react";
import { Wrench, ChevronRight, Plus, X, History, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface PitCrewCheckProps {
  onSubmit: (symptom: string, images: string[]) => void;
  disabled?: boolean;
  onOpenChat: () => void;
  onViewPastChecks?: () => void;
}

const PitCrewCheck = ({ onSubmit, disabled, onOpenChat, onViewPastChecks }: PitCrewCheckProps) => {
  const [symptom, setSymptom] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showHelper, setShowHelper] = useState(true);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          setImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!symptom.trim() && images.length === 0) return;
    onSubmit(symptom, images);
    setSymptom("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 space-y-4">
      {/* Compact Pit Crew Check card */}
      <div className="card-vignette p-4 md:p-5 animate-fade-slide-up">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Title and description */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pit Crew Check</h2>
              <p className="text-sm text-muted-foreground">Guided diagnosis for any symptom.</p>
            </div>
          </div>
          
          {/* Right: Past checks button */}
          {onViewPastChecks && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewPastChecks}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <History className="w-4 h-4 mr-1" />
              Past checks
            </Button>
          )}
        </div>
        
        {/* Feature bullets */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/80">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary/60" />
            Brakes, noises, leaks
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary/60" />
            Safety rating
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-primary/60" />
            Mechanic summary
          </span>
        </div>
      </div>

      {/* First-open helper card - without "Try an example" */}
      {showHelper && (
        <div className="bg-card/50 border border-border/30 rounded-2xl p-4 animate-fade-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground mb-2">How Pit Crew Check works</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  <span>Describe a symptom (noise, vibration, warning light...)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  <span>Get a safety rating for your situation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  <span>Follow a mechanic-ready checklist</span>
                </li>
              </ul>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelper(false)}
              className="h-6 w-6 shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Symptom input section */}
      <div className="space-y-2 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
        <label className="text-sm font-medium text-foreground pl-1">
          Describe what's happening
        </label>
        
        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-14 h-14 object-cover rounded-xl border border-border/40"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="panel-floating focus-lift p-2 flex items-end gap-2">
          <label className="cursor-pointer btn-glow hover-lift transition-smooth">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={disabled}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={disabled}
              className="pointer-events-none h-10 w-10 rounded-full hover:bg-secondary/50"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </Button>
          </label>

          <Textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what your car is doing..."
            disabled={disabled}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-body placeholder:text-muted-foreground/60 text-base"
            rows={2}
            style={{ fontSize: '16px' }}
          />

          <Button
            onClick={handleSubmit}
            disabled={disabled || (!symptom.trim() && images.length === 0)}
            className="h-10 px-4 rounded-full bg-primary hover:bg-primary/90 btn-glow hover-lift btn-tap shrink-0 transition-smooth gap-1"
          >
            <span className="hidden sm:inline">Start</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Helper text */}
        <p className="text-xs text-muted-foreground/60 pl-1">
          Type what your car is doing for the most accurate checklist.
        </p>
      </div>

      {/* Secondary action - open chat */}
      <div className="flex items-center justify-between py-2 animate-fade-slide-up" style={{ animationDelay: "150ms" }}>
        <span className="text-sm text-muted-foreground">Just have a quick question?</span>
        <button
          onClick={onOpenChat}
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Open Pit Lane Talk →
        </button>
      </div>
    </div>
  );
};

export default PitCrewCheck;

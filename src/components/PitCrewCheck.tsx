import { useState } from "react";
import { Wrench, ChevronRight, Plus, X } from "lucide-react";
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
    <div className="w-full space-y-3">
      {/* Hero Pit Crew Check card with integrated input */}
      <div className="card-vignette p-5 md:p-6 animate-fade-slide-up space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground font-brand">Pit Crew Check</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Guided diagnosis for any symptom</p>
          </div>
        </div>
        
        {/* Feature bullets */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            Brakes, noises, leaks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            Safety rating
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
            Step-by-step guide
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/20" />

        {/* Input section - integrated into card */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Describe what's happening
          </label>
          
          {/* Image previews */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
          <div className="bg-secondary/30 rounded-2xl p-2 flex items-end gap-2 border border-border/20">
            <label className="cursor-pointer">
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
              className="flex-1 min-h-[44px] max-h-[100px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/50 text-base"
              rows={1}
              style={{ fontSize: '16px' }}
            />

            <Button
              onClick={handleSubmit}
              disabled={disabled || (!symptom.trim() && images.length === 0)}
              className="h-10 px-5 rounded-full bg-primary hover:bg-primary/90 btn-glow shrink-0 transition-smooth gap-1.5"
            >
              <span className="hidden sm:inline">Start</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-muted-foreground/50">
            Type what your car is doing for the most accurate diagnosis
          </p>
        </div>
      </div>

      {/* Secondary action - Pit Lane Talk link */}
      <div className="flex items-center justify-center py-2 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
        <span className="text-sm text-muted-foreground">Just have a quick question?</span>
        <button
          onClick={onOpenChat}
          className="ml-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        >
          Open Pit Lane Talk →
        </button>
      </div>
    </div>
  );
};

export default PitCrewCheck;

import { useState } from "react";
import { Wrench, Send, Mic, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface PitCrewCheckProps {
  onSubmit: (symptom: string, images: string[]) => void;
  disabled?: boolean;
  onOpenChat: () => void;
}

const PitCrewCheck = ({ onSubmit, disabled, onOpenChat }: PitCrewCheckProps) => {
  const [symptom, setSymptom] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Hero section */}
      <div className="card-vignette p-8 md:p-12 mb-6 text-center animate-fade-slide-up">
        <Wrench className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4 md:mb-6 animate-pulse-slow" />
        <h2 className="text-heading text-foreground mb-3 md:mb-4 font-serif">
          Pit Crew Check
        </h2>
        <p className="text-body text-muted-foreground max-w-md mx-auto leading-relaxed mb-2">
          Describe what's happening with your vehicle. We'll guide you through a mechanic-style checklist.
        </p>
        <p className="text-small text-muted-foreground/70">
          Noises, vibrations, warning lights, smells, leaks, or anything unusual.
        </p>
      </div>

      {/* Symptom input */}
      <div className="animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 mb-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Preview ${idx + 1}`}
                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl border border-border/40"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="panel-floating focus-lift p-2 flex items-end gap-2 md:gap-3">
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
              className="pointer-events-none h-10 w-10 md:h-11 md:w-11 rounded-full hover:bg-secondary/50"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </Button>
          </label>

          <Textarea
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Engine makes a rattling noise when cold..."
            disabled={disabled}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-body placeholder:text-muted-foreground/60"
            rows={2}
          />

          <Button
            onClick={handleSubmit}
            disabled={disabled || (!symptom.trim() && images.length === 0)}
            size="icon"
            className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-primary hover:bg-primary/90 btn-glow hover-lift btn-tap shrink-0 transition-smooth"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Secondary action - open chat */}
        <div className="text-center mt-6 animate-fade-slide-up" style={{ animationDelay: "200ms" }}>
          <button
            onClick={onOpenChat}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Or <span className="underline">ask anything</span> in Pit Lane Talk
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitCrewCheck;

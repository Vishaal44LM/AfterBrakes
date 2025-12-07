import { useState, useRef, useEffect } from "react";
import { Send, X, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void;
  disabled?: boolean;
  showMic?: boolean;
  placeholder?: string;
  variant?: "primary" | "secondary";
}

const ChatInput = ({
  onSend,
  disabled,
  showMic = false,
  placeholder = "Ask about your vehicle...",
  variant = "primary",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!showMic) return;
    
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setMessage(prev => prev + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast({
          title: "Voice input error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast, showMic]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive"
        });
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!message.trim() && images.length === 0) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    onSend(message, images);
    setMessage("");
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSecondary = variant === "secondary";

  return (
    <div className="w-full space-y-3">
      {/* Voice recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-3 py-2 animate-fade-slide-up">
          <div className="voice-waveform">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="text-sm text-primary font-medium">Listening...</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 px-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={img}
                alt={`Preview ${idx + 1}`}
                className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-xl border border-border/40"
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
            className="pointer-events-none h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-secondary/50"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
          </Button>
        </label>

        {showMic && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            onClick={toggleRecording}
            className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all ${
              isRecording
                ? "bg-primary/20 text-primary mic-recording"
                : "hover:bg-secondary/50 text-muted-foreground"
            }`}
          >
            <Mic className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        )}

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base placeholder:text-muted-foreground/60"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && images.length === 0)}
          size="icon"
          variant={isSecondary ? "outline" : "default"}
          className={`h-9 w-9 md:h-10 md:w-10 rounded-full shrink-0 transition-smooth ${
            isSecondary
              ? "border-primary/30 text-primary hover:bg-primary/10"
              : "bg-primary hover:bg-primary/90 btn-glow hover-lift btn-tap"
          }`}
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
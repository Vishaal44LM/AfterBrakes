import { useState, useRef, useEffect } from "react";
import { Send, X, Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
interface ChatInputProps {
  onSend: (message: string, images: string[]) => void;
  disabled?: boolean;
}
const ChatInput = ({
  onSend,
  disabled
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = event => {
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
      recognitionRef.current.onerror = event => {
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
  }, [toast]);
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
  return <div className="w-full space-y-3">
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

      {/* Image previews with smooth animation like mic UI */}
      {images.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-2 animate-fade-slide-up">
          <div className="flex flex-wrap gap-2 items-center">
            {images.map((img, idx) => (
              <div key={idx} className="relative group animate-scale-in">
                <img 
                  src={img} 
                  alt={`Preview ${idx + 1}`} 
                  className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-xl border border-primary/30 shadow-lg shadow-primary/10" 
                />
                <button 
                  onClick={() => removeImage(idx)} 
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <span className="text-sm text-primary font-medium ml-2">{images.length} image{images.length > 1 ? 's' : ''} attached</span>
          </div>
        </div>
      )}

      <div className="panel-floating focus-lift p-2 flex items-end gap-2 md:gap-3">
        <label className="cursor-pointer btn-glow hover-lift transition-smooth">
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={disabled} />
          <Button type="button" size="icon" variant="ghost" disabled={disabled} className="pointer-events-none h-10 w-10 md:h-11 md:w-11 rounded-full hover:bg-secondary/50">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </Button>
        </label>

        <Button type="button" size="icon" variant="ghost" disabled={disabled} onClick={toggleRecording} className={`h-10 w-10 md:h-11 md:w-11 rounded-full transition-all ${isRecording ? "bg-primary/20 text-primary mic-recording" : "hover:bg-secondary/50 text-muted-foreground"}`}>
          <Mic className="w-5 h-5" />
        </Button>

        <Textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe your issue..." disabled={disabled} className="flex-1 min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-body placeholder:text-muted-foreground/60" rows={1} />

        <Button onClick={handleSend} disabled={disabled || !message.trim() && images.length === 0} size="icon" className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-primary hover:bg-primary/90 btn-glow hover-lift btn-tap shrink-0 transition-smooth">
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>;
};
export default ChatInput;
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Mic, Plus, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import ActionSheet from "./ActionSheet";

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
  const [showVoiceSheet, setShowVoiceSheet] = useState(false);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<string>("");
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
          transcriptRef.current += finalTranscript;
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setShowVoiceSheet(false);
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

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setHoldStartTime(Date.now());
    } catch (e) {
      console.error("Error starting recognition:", e);
    }
  }, [toast]);

  const stopRecording = useCallback((cancelled: boolean) => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      
      if (!cancelled && transcriptRef.current.trim()) {
        setMessage(prev => prev + transcriptRef.current);
        toast({
          title: "Voice captured",
          description: "Your speech has been added to the message.",
        });
      } else if (cancelled) {
        toast({
          title: "Cancelled",
          description: "Voice input was cancelled.",
        });
      }
      transcriptRef.current = "";
    }
    setHoldStartTime(null);
    setShowVoiceSheet(false);
  }, [isRecording, toast]);

  const handleMicPressStart = useCallback(() => {
    setShowVoiceSheet(true);
    startRecording();
  }, [startRecording]);

  const handleMicPressEnd = useCallback(() => {
    // If held for less than 500ms, treat as cancel
    const wasShortPress = holdStartTime && (Date.now() - holdStartTime) < 500;
    stopRecording(wasShortPress || false);
  }, [holdStartTime, stopRecording]);

  const handleCloseVoiceSheet = useCallback(() => {
    stopRecording(true);
  }, [stopRecording]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    let processedCount = 0;
    
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive"
        });
        processedCount++;
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processedCount++;
        if (processedCount === files.length) {
          setImages(prev => [...prev, ...newImages]);
          setShowImageSheet(false);
        }
      };
      reader.readAsDataURL(file);
    }
    
    e.target.value = '';
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
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
          disabled={disabled}
        />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          onClick={() => setShowImageSheet(true)}
          className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-secondary/50 btn-glow hover-lift transition-smooth"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
        </Button>

        {showMic && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            onMouseDown={handleMicPressStart}
            onMouseUp={handleMicPressEnd}
            onMouseLeave={() => isRecording && handleMicPressEnd()}
            onTouchStart={handleMicPressStart}
            onTouchEnd={handleMicPressEnd}
            className={`h-9 w-9 md:h-10 md:w-10 rounded-full transition-all select-none ${
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
          className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
          rows={1}
          style={{ fontSize: '16px' }}
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

      {/* Voice Input Action Sheet - Hold to talk */}
      <ActionSheet
        isOpen={showVoiceSheet}
        onClose={handleCloseVoiceSheet}
        title="Voice input"
      >
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Voice waveform */}
          <div className="flex items-center justify-center gap-3">
            {isRecording ? (
              <>
                <div className="voice-waveform">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-sm text-primary font-medium">Listening...</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Release to cancel</span>
            )}
          </div>

          {/* Mic indicator */}
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-primary text-primary-foreground mic-recording"
                : "bg-secondary text-foreground"
            }`}
          >
            <Mic className="w-7 h-7" />
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {isRecording
              ? "Keep holding to record. Release to add to message."
              : "Hold the mic button to record voice input."
            }
          </p>
        </div>
      </ActionSheet>

      {/* Image Upload Action Sheet */}
      <ActionSheet
        isOpen={showImageSheet}
        onClose={() => setShowImageSheet(false)}
        title="Add images"
      >
        <div className="flex flex-col gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-4 w-full p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Take photo</p>
              <p className="text-xs text-muted-foreground">Use your camera to capture an image</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-4 w-full p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Choose from gallery</p>
              <p className="text-xs text-muted-foreground">Select existing images from your device</p>
            </div>
          </button>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Maximum file size: 20MB per image
          </p>
        </div>
      </ActionSheet>
    </div>
  );
};

export default ChatInput;

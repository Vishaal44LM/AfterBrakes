import { useState, useRef, KeyboardEvent } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!message.trim() && images.length === 0) return;
    onSend(message, images);
    setMessage("");
    setImages([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {images.map((img, idx) => (
            <div key={idx} className="relative flex-shrink-0">
              <img
                src={img}
                alt={`Upload ${idx + 1}`}
                className="w-16 h-16 object-cover rounded border border-primary"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 hover:bg-primary/10 border-primary/50"
        >
          <ImagePlus className="w-4 h-4" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your car, bike, or upload an image..."
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none bg-input border-border focus:border-primary"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && images.length === 0)}
          size="icon"
          className="flex-shrink-0 bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;

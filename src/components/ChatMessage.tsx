import { User, Wrench } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const ChatMessage = ({ role, content, images }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-lg p-4 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          }`}
        >
          {images && images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Upload ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded border border-border"
                />
              ))}
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none">
            {content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2 last:mb-0 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-4 h-4 text-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

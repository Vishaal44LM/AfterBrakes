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
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/40 mt-1">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={`${isUser ? "order-first" : ""}`}>
        <div className={isUser ? "message-user" : "message-assistant"}>
          {images && images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Upload ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-2xl border border-border/40"
                />
              ))}
            </div>
          )}
          <div className="text-body">
            {content.split('\n\n').map((paragraph, idx) => {
              // Check if paragraph is a numbered list
              if (/^\d+\./.test(paragraph)) {
                const items = paragraph.split('\n').filter(line => /^\d+\./.test(line));
                return (
                  <ol key={idx} className="list-decimal list-inside space-y-2 mb-4">
                    {items.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        {item.replace(/^\d+\.\s*/, '')}
                      </li>
                    ))}
                  </ol>
                );
              }
              // Check if paragraph is a bullet list
              else if (/^[-•]/.test(paragraph)) {
                const items = paragraph.split('\n').filter(line => /^[-•]/.test(line));
                return (
                  <ul key={idx} className="list-disc list-inside space-y-2 mb-4">
                    {items.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        {item.replace(/^[-•]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              // Regular paragraph
              else if (paragraph.trim()) {
                return (
                  <p key={idx} className="mb-3 last:mb-0 leading-relaxed">
                    {paragraph}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

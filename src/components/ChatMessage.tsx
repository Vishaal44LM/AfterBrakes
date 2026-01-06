import { User, Wrench, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SeverityIndicator, { SeverityLevel } from "./SeverityIndicator";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  onShare?: () => void;
}

const parseSeverity = (content: string): { severity: SeverityLevel; cleanContent: string } => {
  const severityMatch = content.match(/^\[SEVERITY:(safe|caution|danger)\]/i);
  if (severityMatch) {
    const severity = severityMatch[1].toLowerCase() as SeverityLevel;
    const cleanContent = content.replace(severityMatch[0], "").trim();
    return { severity, cleanContent };
  }
  return { severity: null, cleanContent: content };
};

// Clean markdown formatting for cleaner display
const cleanMarkdown = (text: string): string => {
  return text
    // Remove asterisks (bold/italic markers)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    // Remove underscores for emphasis
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Clean up any remaining stray asterisks
    .replace(/\*/g, "")
    .trim();
};

const ChatMessage = ({ role, content, images, onShare }: ChatMessageProps) => {
  const isUser = role === "user";
  const { severity, cleanContent } = isUser ? { severity: null, cleanContent: content } : parseSeverity(content);
  
  // Clean the content for assistant messages
  const displayContent = isUser ? cleanContent : cleanMarkdown(cleanContent);

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end animate-fade-slide-right" : "justify-start animate-fade-slide-left"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/40 mt-1">
          <Wrench className="w-4 h-4 text-primary" />
        </div>
      )}
      
      <div className={`${isUser ? "order-first" : ""} relative group max-w-[85%] md:max-w-[75%]`}>
        <div className={isUser ? "message-user" : "message-assistant"}>
          {!isUser && severity && <SeverityIndicator severity={severity} />}
          
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
          
          {/* Clean, line-by-line rendering with animation */}
          <div className="text-body space-y-2">
            {displayContent.split('\n\n').map((paragraph, idx) => {
              // Numbered list
              if (/^\d+\./.test(paragraph)) {
                const items = paragraph.split('\n').filter(line => /^\d+\./.test(line));
                return (
                  <ol key={idx} className="space-y-2">
                    {items.map((item, i) => (
                      <li 
                        key={i} 
                        className="flex gap-3 animate-fade-slide-up"
                        style={{ animationDelay: `${(idx * items.length + i) * 50}ms` }}
                      >
                        <span className="text-primary font-medium shrink-0 w-5">
                          {item.match(/^\d+/)?.[0]}.
                        </span>
                        <span className="text-foreground/90 leading-relaxed">
                          {cleanMarkdown(item.replace(/^\d+\.\s*/, ''))}
                        </span>
                      </li>
                    ))}
                  </ol>
                );
              }
              // Bullet list
              else if (/^[-•]/.test(paragraph)) {
                const items = paragraph.split('\n').filter(line => /^[-•]/.test(line));
                return (
                  <ul key={idx} className="space-y-2">
                    {items.map((item, i) => (
                      <li 
                        key={i} 
                        className="flex gap-3 animate-fade-slide-up"
                        style={{ animationDelay: `${(idx * items.length + i) * 50}ms` }}
                      >
                        <span className="text-primary shrink-0 mt-1.5">•</span>
                        <span className="text-foreground/90 leading-relaxed">
                          {cleanMarkdown(item.replace(/^[-•]\s*/, ''))}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }
              // Regular paragraph
              else if (paragraph.trim()) {
                return (
                  <p 
                    key={idx} 
                    className="text-foreground/90 leading-relaxed animate-fade-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {cleanMarkdown(paragraph)}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
        
        {!isUser && onShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            className="absolute -bottom-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-card/80 hover:bg-card border border-border/40"
            title="Share with mechanic"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        )}
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

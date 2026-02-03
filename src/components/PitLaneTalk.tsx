import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Car, MessageSquarePlus, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInput from "./ChatInput";
import CrewsTakeSheet from "./CrewsTakeSheet";
import { useToast } from "@/components/ui/use-toast";
import { Vehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface PitLaneTalkProps {
  vehicle: Vehicle | null;
  userId: string;
  initialMessages?: Message[];
  chatId?: string | null;
  onBack: () => void;
  onStartGuidedCheck: (symptom: string) => void;
  onNewChat?: () => void;
  prefillMessage?: string;
}

const suggestionChips = [
  { label: "Service interval", query: "What's the recommended service interval for my car?" },
  { label: "Tyre pressure", query: "What should my tyre pressure be?" },
  { label: "Best engine oil", query: "What's the best engine oil for my vehicle?" },
  { label: "Buying tips", query: "What should I check when buying a used car?" },
];

// Clean markdown formatting
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\*/g, "")
    .trim();
};

const PitLaneTalk = ({
  vehicle,
  userId,
  initialMessages = [],
  chatId = null,
  onBack,
  onStartGuidedCheck,
  onNewChat,
  prefillMessage,
}: PitLaneTalkProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [showCrewsTake, setShowCrewsTake] = useState(false);
  const [hasCrewsTakeUpdate, setHasCrewsTakeUpdate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (prefillMessage && messages.length === 0) {
      handleSend(prefillMessage, []);
    }
  }, [prefillMessage]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  const saveChatHistory = async (msgs: Message[]) => {
    if (!userId || msgs.length === 0) return;

    try {
      const title = msgs[0]?.content.substring(0, 100) || "New Chat";
      const vehicleTag = vehicle ? `${vehicle.manufacturer} ${vehicle.model}` : null;

      if (currentChatId) {
        await supabase
          .from("chat_history")
          .update({
            messages: msgs as any,
            title,
            vehicle_id: vehicle?.id || null,
            vehicle_tag: vehicleTag,
          })
          .eq("id", currentChatId);
      } else {
        const { data } = await supabase
          .from("chat_history")
          .insert({
            user_id: userId,
            title,
            messages: msgs as any,
            vehicle_id: vehicle?.id || null,
            vehicle_tag: vehicleTag,
          })
          .select()
          .single();

        if (data) {
          setCurrentChatId(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  };

  const streamChat = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/automotive-chat`;

    const messagesToSend = userMessages.map((msg) => ({
      role: msg.role,
      content:
        msg.images && msg.images.length > 0
          ? [
              { type: "text", text: msg.content },
              ...msg.images.map((img) => ({
                type: "image_url",
                image_url: { url: img },
              })),
            ]
          : msg.content,
    }));

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: messagesToSend,
        vehicle: vehicle
          ? {
              manufacturer: vehicle.manufacturer,
              model: vehicle.model,
              year: vehicle.year,
              fuel: vehicle.fuel,
            }
          : null,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({
        error: "Failed to connect to AI service",
      }));
      throw new Error(errorData.error || "Failed to start chat");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (message: string, images: string[]) => {
    const userMessage: Message = {
      role: "user",
      content: message,
      images: images.length > 0 ? images : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      await streamChat(newMessages);
      setHasCrewsTakeUpdate(true);
      setTimeout(() => {
        setMessages((current) => {
          saveChatHistory(current);
          return current;
        });
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (query: string) => {
    handleSend(query, []);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setHasCrewsTakeUpdate(false);
    if (onNewChat) onNewChat();
  };

  const handleOpenCrewsTake = () => {
    setShowCrewsTake(true);
    setHasCrewsTakeUpdate(false);
  };

  const isEmpty = messages.length === 0;

  // Render message content with line-by-line animation
  const renderMessageContent = (content: string, isAssistant: boolean) => {
    const cleanContent = cleanMarkdown(content);
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());

    return (
      <div className="space-y-3">
        {paragraphs.map((paragraph, idx) => {
          // Numbered list
          if (/^\d+\./.test(paragraph)) {
            const items = paragraph.split('\n').filter(line => /^\d+\./.test(line));
            return (
              <ol key={idx} className="space-y-2">
                {items.map((item, i) => (
                  <li 
                    key={i} 
                    className={`flex gap-3 ${isAssistant ? 'animate-fade-slide-up' : ''}`}
                    style={isAssistant ? { animationDelay: `${(idx * items.length + i) * 50}ms` } : undefined}
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
                    className={`flex gap-3 ${isAssistant ? 'animate-fade-slide-up' : ''}`}
                    style={isAssistant ? { animationDelay: `${(idx * items.length + i) * 50}ms` } : undefined}
                  >
                    <span className="text-primary shrink-0 mt-0.5">•</span>
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
                className={`text-foreground/90 leading-relaxed ${isAssistant ? 'animate-fade-slide-up' : ''}`}
                style={isAssistant ? { animationDelay: `${idx * 50}ms` } : undefined}
              >
                {paragraph}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-secondary/30 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Back</span>
        </Button>

        <span className="text-sm font-medium text-foreground/80">Pit Lane Talk</span>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenCrewsTake}
              className="relative hover:bg-secondary/30 text-xs gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Summary</span>
              {hasCrewsTakeUpdate && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="hover:bg-secondary/30"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area - Edge to edge, page scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
      >
        {isEmpty ? (
          <div className="flex flex-col h-full">
            {/* Welcome section */}
            <div className="px-4 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground font-brand">Pit Lane Talk</h2>
                  <p className="text-sm text-muted-foreground">Your automotive expert</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground/80 leading-relaxed mb-6">
                Ask anything about your car. I can help with maintenance advice, 
                explain how things work, or help diagnose issues through conversation.
              </p>

              {/* Suggestion chips */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground/50 uppercase tracking-wide">Try asking</span>
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleChipClick(chip.query)}
                      className="px-3 py-1.5 text-sm rounded-full border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`px-4 py-3 ${
                  msg.role === "user" 
                    ? "bg-secondary/20" 
                    : "bg-transparent"
                }`}
              >
                <div className="max-w-[95vw] mx-auto">
                  {/* Images if any */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img}
                          alt={`Upload ${imgIdx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className="text-[15px] leading-[1.6]">
                    {renderMessageContent(msg.content, msg.role === "assistant")}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="px-4 py-3">
                <div className="max-w-[95vw] mx-auto">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Progress bar when loading */}
      {isLoading && <div className="progress-bar absolute top-[52px] left-0 right-0 z-50" />}

      {/* Fixed Input Bar */}
      <div className="border-t border-border/10 bg-background">
        <div className="max-w-[95vw] mx-auto px-4 py-3">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            showMic
            placeholder="Ask anything about your car..."
            variant="secondary"
          />
        </div>
      </div>

      {/* Crew's Take Sheet */}
      <CrewsTakeSheet
        isOpen={showCrewsTake}
        onClose={() => setShowCrewsTake(false)}
        messages={messages}
        hasUpdates={hasCrewsTakeUpdate}
      />
    </div>
  );
};

export default PitLaneTalk;
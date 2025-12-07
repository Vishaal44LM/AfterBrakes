import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Wrench, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import MechanicSummary from "./MechanicSummary";
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
}

const PitLaneTalk = ({
  vehicle,
  userId,
  initialMessages = [],
  chatId = null,
  onBack,
  onStartGuidedCheck,
}: PitLaneTalkProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [showMechanicSummary, setShowMechanicSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update messages when initialMessages change (e.g., loading from history)
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Update chatId when prop changes
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

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="btn-glow hover:bg-secondary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <span className="text-sm font-medium text-foreground">Pit Lane Talk</span>

          <div className="w-16" />
        </div>
        
        {/* Mode info strip */}
        <div className="flex items-center justify-between px-4 py-2 bg-card/30 text-xs">
          <span className="text-muted-foreground">For symptoms and safety, use Pit Crew Check.</span>
          <button
            onClick={() => onStartGuidedCheck("")}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Start Pit Crew Check
          </button>
        </div>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-xl">
            {/* Minimal empty state */}
            <p className="text-center text-muted-foreground mb-6">
              Quick questions, maintenance tips, or general advice.
            </p>
            <ChatInput onSend={handleSend} disabled={isLoading} showMic placeholder="Ask anything about your car... (you can use the mic)" />
          </div>
        </div>
      ) : (
        <>
          {isLoading && <div className="progress-bar absolute top-0 left-0 right-0 z-50" />}

          <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  images={msg.images}
                  onShare={
                    msg.role === "assistant" ? () => setShowMechanicSummary(true) : undefined
                  }
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/40">
                    <Wrench className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="message-assistant">
                    <div className="flex gap-1.5">
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Turn into guided check pill + input */}
          <div className="border-t border-border/20 bg-background/80 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto w-full px-4 py-3 space-y-3">
              {/* Guided check nudge - above input */}
              {messages.length >= 2 && !isLoading && (
                <button
                  onClick={() =>
                    onStartGuidedCheck(messages.find((m) => m.role === "user")?.content || "")
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-full border border-primary/20 text-sm text-primary hover:bg-primary/5 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Turn this into a Pit Crew Check
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              
              <ChatInput onSend={handleSend} disabled={isLoading} showMic placeholder="Ask anything about your car..." variant="secondary" />
            </div>
          </div>
        </>
      )}

      {showMechanicSummary && (
        <MechanicSummary
          messages={messages}
          vehicle={vehicle}
          onClose={() => setShowMechanicSummary(false)}
        />
      )}
    </div>
  );
};

export default PitLaneTalk;
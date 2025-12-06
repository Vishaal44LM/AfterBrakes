import { useState, useRef, useEffect } from "react";
import { Car, ArrowLeft, Wrench } from "lucide-react";
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
  onBack: () => void;
  onStartGuidedCheck: (symptom: string) => void;
}

const PitLaneTalk = ({
  vehicle,
  userId,
  initialMessages = [],
  onBack,
  onStartGuidedCheck,
}: PitLaneTalkProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showMechanicSummary, setShowMechanicSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveChatHistory = async (msgs: Message[]) => {
    if (!userId || msgs.length === 0) return;

    try {
      const title = msgs[0]?.content.substring(0, 100) || "New Chat";

      if (currentChatId) {
        await supabase
          .from("chat_history")
          .update({
            messages: msgs as any,
            title,
            vehicle_id: vehicle?.id || null,
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="btn-glow hover:bg-secondary/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Pit Lane Talk</span>
        </div>

        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl text-center">
            <Car className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse-slow" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Pit Lane Talk</h2>
            <p className="text-body text-muted-foreground mb-6">
              Ask anything about your vehicle – diagnostics, maintenance, parts, or general advice.
            </p>
            <ChatInput onSend={handleSend} disabled={isLoading} />

            {/* Nudge to guided check */}
            <button
              onClick={() => onStartGuidedCheck("")}
              className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border border-primary/30 text-sm text-primary hover:bg-primary/10 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Turn this into a guided checklist
            </button>
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
                    <Car className="w-4 h-4 text-primary animate-pulse" />
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

              {/* Guided check nudge */}
              {messages.length >= 2 && !isLoading && (
                <div className="flex justify-center">
                  <button
                    onClick={() =>
                      onStartGuidedCheck(messages.find((m) => m.role === "user")?.content || "")
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-sm text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    Turn this into a guided checklist
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-border/20 bg-background/80 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto w-full px-4 py-4">
              <ChatInput onSend={handleSend} disabled={isLoading} />
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

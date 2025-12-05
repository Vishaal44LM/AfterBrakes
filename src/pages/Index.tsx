import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Plus, LogOut, Clipboard } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import HistoryDrawer from "@/components/HistoryDrawer";
import GaragePill from "@/components/GaragePill";
import GarageSelector from "@/components/GarageSelector";
import MechanicSummary from "@/components/MechanicSummary";
import GuidedDiagnosis from "@/components/diagnosis/GuidedDiagnosis";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles, Vehicle } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showGarageSelector, setShowGarageSelector] = useState(false);
  const [showMechanicSummary, setShowMechanicSummary] = useState(false);
  const [showGuidedDiagnosis, setShowGuidedDiagnosis] = useState(false);
  const [diagnosisSymptom, setDiagnosisSymptom] = useState("");
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { vehicles, activeVehicle, setActiveVehicle, refresh: refreshVehicles } = useVehicles(user?.id);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (vehicleToast) {
      const timer = setTimeout(() => setVehicleToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [vehicleToast]);

  const saveChatHistory = async (msgs: Message[]) => {
    if (!user || msgs.length === 0) return;
    try {
      const title = msgs[0]?.content.substring(0, 100) || 'New Chat';
      if (currentChatId) {
        await supabase.from('chat_history').update({
          messages: msgs as any,
          title,
          vehicle_id: activeVehicle?.id || null
        }).eq('id', currentChatId);
      } else {
        const { data } = await supabase.from('chat_history').insert({
          user_id: user.id,
          title,
          messages: msgs as any,
          vehicle_id: activeVehicle?.id || null
        }).select().single();
        if (data) {
          setCurrentChatId(data.id);
        }
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const streamChat = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/automotive-chat`;
    const messagesToSend = userMessages.map(msg => ({
      role: msg.role,
      content: msg.images && msg.images.length > 0 ? [{
        type: "text",
        text: msg.content
      }, ...msg.images.map(img => ({
        type: "image_url",
        image_url: { url: img }
      }))] : msg.content
    }));

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: messagesToSend,
        vehicle: activeVehicle ? {
          manufacturer: activeVehicle.manufacturer,
          model: activeVehicle.model,
          year: activeVehicle.year
        } : null
      })
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({
        error: "Failed to connect to AI service"
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
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
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

  // Check if message looks like a car problem description
  const looksLikeDiagnosticQuery = (message: string): boolean => {
    const diagnosticKeywords = [
      'noise', 'sound', 'squeal', 'grinding', 'vibrat', 'shake', 'shaking',
      'smell', 'leak', 'warning light', 'check engine', 'brake', 'steer',
      'start', 'won\'t start', 'overheat', 'smoke', 'pull', 'pulling',
      'issue', 'problem', 'trouble', 'weird', 'strange'
    ];
    const lowerMessage = message.toLowerCase();
    return diagnosticKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleSend = async (message: string, images: string[]) => {
    const userMessage: Message = {
      role: "user",
      content: message,
      images: images.length > 0 ? images : undefined
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      await streamChat(newMessages);
      setTimeout(() => {
        setMessages(current => {
          saveChatHistory(current);
          return current;
        });
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleLoadChat = (loadedMessages: any[]) => {
    setMessages(loadedMessages as Message[]);
    setCurrentChatId(null);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setVehicleToast(`Now diagnosing: ${vehicle.manufacturer} ${vehicle.model} ${vehicle.year}`);
  };

  const handleStartDiagnosis = (symptom: string) => {
    setDiagnosisSymptom(symptom);
    setShowGuidedDiagnosis(true);
  };

  const handleDiagnosisQuestion = (question: string) => {
    // Close diagnosis and send the question to chat
    setShowGuidedDiagnosis(false);
    handleSend(question, []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Car className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isEmpty = messages.length === 0;
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
  const showDiagnosisPrompt = lastUserMessage && 
    messages.length >= 2 && 
    looksLikeDiagnosticQuery(lastUserMessage.content) &&
    !showGuidedDiagnosis;

  return (
    <div className="flex flex-col h-screen bg-background relative">
      <div className="seam-line absolute top-0 left-0 right-0" />
      
      <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 mx-4 md:mx-6 mt-4 mb-2 panel-floating">
        <div className="flex items-center gap-2 md:gap-3">
          <HistoryDrawer onLoadChat={handleLoadChat} />
          <Button variant="ghost" size="sm" onClick={handleNewChat} className="btn-glow hover:bg-secondary/50 transition-smooth">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Car className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          <h1 className="text-base font-semibold text-foreground font-serif md:text-xl">After Brakes</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={signOut} className="btn-glow hover:bg-secondary/50 transition-smooth">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </header>

      <div className="px-4 mb-2">
        <GaragePill vehicle={activeVehicle} onClick={() => setShowGarageSelector(true)} className="text-center" />
      </div>

      {vehicleToast && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-card border border-primary/30 rounded-full shadow-lg shadow-primary/20 animate-fade-slide-up">
          <span className="text-sm text-foreground">{vehicleToast}</span>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl">
            <div className="card-vignette p-8 md:p-12 mb-8 text-center animate-fade-slide-up">
              <Car className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4 md:mb-6 animate-pulse-slow" />
              <h2 className="text-heading text-foreground mb-3 md:mb-4 font-serif">
                Welcome to After Brakes
              </h2>
              <p className="text-body text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
                Your pit crew for every drive.
              </p>
              
              {/* Quick action for Guided Diagnosis */}
              <button
                onClick={() => {
                  toast({
                    title: "Describe your issue",
                    description: "Type your symptom below, then we'll start a guided diagnosis.",
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-primary/30 text-sm text-foreground hover:bg-secondary hover:border-primary/50 transition-all"
              >
                <Clipboard className="w-4 h-4 text-primary" />
                Start guided diagnosis
              </button>
            </div>
            <div className="animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoading && <div className="progress-bar absolute top-0 left-0 right-0 z-50" />}

          <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              {messages.map((msg, idx) => (
                <ChatMessage 
                  key={idx} 
                  role={msg.role} 
                  content={msg.content} 
                  images={msg.images} 
                  onShare={msg.role === "assistant" ? () => setShowMechanicSummary(true) : undefined} 
                />
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/40">
                    <Car className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div className="message-assistant">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Guided Diagnosis prompt after diagnostic-looking queries */}
              {showDiagnosisPrompt && !isLoading && (
                <div className="flex justify-center animate-fade-slide-up">
                  <button
                    onClick={() => handleStartDiagnosis(lastUserMessage.content)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-sm text-foreground hover:bg-primary/20 hover:border-primary/50 transition-all"
                  >
                    <Clipboard className="w-4 h-4 text-primary" />
                    Start guided diagnosis for this issue
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-border/20 bg-background/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto w-full px-4 py-4">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </>
      )}

      <div className="seam-line absolute bottom-0 left-0 right-0" />

      {showGarageSelector && user && (
        <GarageSelector 
          vehicles={vehicles} 
          activeVehicle={activeVehicle} 
          onSelect={handleSelectVehicle} 
          onClose={() => setShowGarageSelector(false)} 
          onRefresh={refreshVehicles} 
          userId={user.id} 
        />
      )}

      {showMechanicSummary && (
        <MechanicSummary 
          messages={messages} 
          vehicle={activeVehicle} 
          onClose={() => setShowMechanicSummary(false)} 
        />
      )}

      {showGuidedDiagnosis && (
        <GuidedDiagnosis
          symptom={diagnosisSymptom}
          vehicle={activeVehicle}
          onClose={() => setShowGuidedDiagnosis(false)}
          onAskQuestion={handleDiagnosisQuestion}
        />
      )}
    </div>
  );
};

export default Index;

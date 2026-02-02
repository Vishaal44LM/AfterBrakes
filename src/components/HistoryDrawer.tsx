import { useState, useEffect } from "react";
import { History, Search, Wrench, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
  vehicle_tag?: string;
  messages: any[];
}

type HistoryMode = "pitCrew" | "pitLane";

interface HistoryDrawerProps {
  onLoadChat: (messages: any[], chatId: string) => void;
  onLoadCheck: (messages: any[], chatId: string) => void;
}

const HistoryDrawer = ({ onLoadChat, onLoadCheck }: HistoryDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchChats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChats((data || []).map(chat => ({
        ...chat,
        messages: chat.messages as any as any[]
      })));
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchChats();
    }
  }, [open, user]);

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.vehicle_tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine if a chat is a Pit Crew Check or Pit Lane Talk
  const getHistoryMode = (chat: ChatHistory): HistoryMode => {
    // Check if the assistant response contains structured checklist indicators
    const assistantMsg = chat.messages.find(m => m.role === "assistant");
    if (!assistantMsg) return "pitLane";
    
    const content = assistantMsg.content?.toLowerCase() || "";
    
    // Check for new Pit Crew Check format (JSON with type field)
    if (content.includes('"type":"pit-crew-check"') || content.includes('"type": "pit-crew-check"')) {
      return "pitCrew";
    }
    
    // Legacy format detection
    const isPitCrewCheck = (content.includes("safety level:") && 
           (content.includes("step") || content.includes("1.") || content.includes("checklist"))) ||
           content.includes("risk level:") ||
           content.includes("failure risk");
    
    return isPitCrewCheck ? "pitCrew" : "pitLane";
  };

  const handleLoadChat = (chat: ChatHistory) => {
    const mode = getHistoryMode(chat);
    
    if (mode === "pitCrew") {
      // Load as Pit Crew Check - route to guided diagnosis screen
      onLoadCheck(chat.messages, chat.id);
    } else {
      // Load as Pit Lane Talk - route to chat screen
      onLoadChat(chat.messages, chat.id);
    }
    setOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="btn-glow hover:bg-secondary/50 transition-smooth"
        >
          <History className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[90vw] md:w-[400px] bg-background border-r border-border/40 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 md:p-6 border-b border-border/40">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">Vehicle History</SheetTitle>
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border/40 rounded-full text-base"
                style={{ fontSize: '16px' }}
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 md:px-6">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {searchQuery ? "No results found" : "No history yet"}
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {filteredChats.map((chat) => {
                  const mode = getHistoryMode(chat);
                  const isCheck = mode === "pitCrew";
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleLoadChat(chat)}
                      className="w-full text-left p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-smooth btn-glow group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCheck ? "bg-primary/10" : "bg-secondary/50"
                        }`}>
                          {isCheck ? (
                            <Wrench className="w-4 h-4 text-primary" />
                          ) : (
                            <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {chat.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(chat.created_at)}</span>
                            {chat.vehicle_tag && (
                              <>
                                <span>•</span>
                                <span className="truncate">{chat.vehicle_tag}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pl-11">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isCheck 
                            ? "bg-primary/10 text-primary" 
                            : "bg-secondary/50 text-muted-foreground"
                        }`}>
                          {isCheck ? "Pit Crew Check" : "Pit Lane Talk"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryDrawer;

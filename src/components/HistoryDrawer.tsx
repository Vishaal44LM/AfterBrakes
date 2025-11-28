import { useState, useEffect } from "react";
import { History, X, Search } from "lucide-react";
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

interface HistoryDrawerProps {
  onLoadChat: (messages: any[]) => void;
}

const HistoryDrawer = ({ onLoadChat }: HistoryDrawerProps) => {
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

  const handleLoadChat = (chat: ChatHistory) => {
    onLoadChat(chat.messages);
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
              <SheetTitle className="text-heading">Chat History</SheetTitle>
            </div>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border/40 rounded-full"
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4 md:px-6">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-small">
                Loading...
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-small">
                {searchQuery ? "No chats found" : "No chat history yet"}
              </div>
            ) : (
              <div className="space-y-3 py-4">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleLoadChat(chat)}
                    className="w-full text-left p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-smooth btn-glow group"
                  >
                    <h3 className="text-body font-medium text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {chat.title}
                    </h3>
                    <div className="flex items-center justify-between text-small text-muted-foreground">
                      <span>{formatDate(chat.created_at)}</span>
                      {chat.vehicle_tag && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {chat.vehicle_tag}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryDrawer;

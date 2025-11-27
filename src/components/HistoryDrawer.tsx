import { useState, useEffect } from 'react';
import { History, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface ChatHistory {
  id: string;
  title: string;
  vehicle_tag: string | null;
  created_at: string;
  messages: Message[];
}

interface HistoryDrawerProps {
  onLoadChat: (messages: any[]) => void;
}

const HistoryDrawer = ({ onLoadChat }: HistoryDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      loadHistory();
    }
  }, [open, user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data || []).map(chat => ({
        ...chat,
        messages: chat.messages as any as Message[]
      })));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load chat history',
        variant: 'destructive',
      });
    }
  };

  const handleLoadChat = (chat: ChatHistory) => {
    onLoadChat(chat.messages);
    setOpen(false);
  };

  const filteredHistory = history.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.vehicle_tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!user) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon" className="border-primary/50 hover:bg-primary/10">
          <History className="w-5 h-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] bg-background border-border">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-foreground">Chat History</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No chats found' : 'No chat history yet'}
              </div>
            ) : (
              filteredHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleLoadChat(chat)}
                  className="w-full text-left bg-card border border-border rounded-lg p-4 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {chat.title}
                      </h3>
                      {chat.vehicle_tag && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-primary/20 text-primary border border-primary/30">
                          {chat.vehicle_tag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(chat.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

export default HistoryDrawer;

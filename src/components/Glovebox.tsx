import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Car, Shield, Leaf, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import GloveboxSheet from "./GloveboxSheet";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

interface GloveboxProps {
  userId: string;
  onBack: () => void;
}

export interface GloveboxDocument {
  id?: string;
  user_id: string;
  document_type: "rc" | "driving_licence" | "insurance" | "puc";
  expiry_date: string | null;
  in_app_reminder: boolean;
  email_reminder: boolean;
  reminder_email: string | null;
  file_url: string | null;
  file_name: string | null;
}

const documentConfig = {
  rc: {
    title: "Registration Certificate (RC)",
    icon: Car,
    color: "text-blue-400"
  },
  driving_licence: {
    title: "Driving Licence",
    icon: FileText,
    color: "text-green-400"
  },
  insurance: {
    title: "Insurance",
    icon: Shield,
    color: "text-amber-400"
  },
  puc: {
    title: "Pollution Under Control (PUC)",
    icon: Leaf,
    color: "text-emerald-400"
  }
};

const getExpiryStatus = (expiryDate: string | null) => {
  if (!expiryDate) {
    return { text: "No expiry date set", variant: "muted" as const };
  }

  const date = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntil = differenceInDays(date, today);

  if (isPast(date) && daysUntil < 0) {
    return { 
      text: `Expired on ${format(date, "dd MMM yyyy")}`, 
      variant: "error" as const 
    };
  }
  
  if (daysUntil <= 30 && daysUntil >= 0) {
    return { 
      text: `Expires in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, 
      variant: "warning" as const 
    };
  }

  return { 
    text: `Expires on ${format(date, "dd MMM yyyy")}`, 
    variant: "normal" as const 
  };
};

const Glovebox = ({ userId, onBack }: GloveboxProps) => {
  const [documents, setDocuments] = useState<Record<string, GloveboxDocument>>({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<"rc" | "driving_licence" | "insurance" | "puc" | null>(null);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("glovebox_documents")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const docsMap: Record<string, GloveboxDocument> = {};
      data?.forEach(doc => {
        docsMap[doc.document_type] = doc as GloveboxDocument;
      });
      setDocuments(docsMap);
    } catch (error) {
      console.error("Error fetching glovebox documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const handleSave = async (doc: GloveboxDocument) => {
    await fetchDocuments();
    setSelectedType(null);
  };

  const docTypes = ["rc", "driving_licence", "insurance", "puc"] as const;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground font-brand">Glovebox</h1>
          <p className="text-xs text-muted-foreground">Your vehicle documents</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : (
          docTypes.map((type, index) => {
            const config = documentConfig[type];
            const doc = documents[type];
            const status = getExpiryStatus(doc?.expiry_date || null);
            const Icon = config.icon;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="w-full card-vignette p-4 flex items-center gap-4 hover:bg-card/80 transition-colors text-left animate-fade-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {config.title}
                  </h3>
                  <p className={`text-xs mt-0.5 ${
                    status.variant === "error" ? "text-destructive" :
                    status.variant === "warning" ? "text-amber-400" :
                    status.variant === "muted" ? "text-muted-foreground/60" :
                    "text-muted-foreground"
                  }`}>
                    {status.text}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0" />
              </button>
            );
          })
        )}

        {/* Info text */}
        <p className="text-xs text-muted-foreground/60 text-center pt-4">
          Set expiry dates to receive reminders before your documents expire.
        </p>
      </div>

      {/* Sheet for editing */}
      {selectedType && (
        <GloveboxSheet
          userId={userId}
          documentType={selectedType}
          existingDoc={documents[selectedType]}
          onClose={() => setSelectedType(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Glovebox;

import { useState, useEffect } from "react";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, isPast } from "date-fns";

interface GloveboxBannerProps {
  userId: string;
  onView: () => void;
}

interface UrgentDoc {
  documentType: string;
  title: string;
  daysUntil: number;
  isExpired: boolean;
}

const documentTitles: Record<string, string> = {
  rc: "RC",
  driving_licence: "Driving Licence",
  insurance: "Insurance",
  puc: "PUC"
};

const GloveboxBanner = ({ userId, onView }: GloveboxBannerProps) => {
  const [urgentDoc, setUrgentDoc] = useState<UrgentDoc | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from("glovebox_documents")
          .select("document_type, expiry_date, in_app_reminder")
          .eq("user_id", userId)
          .eq("in_app_reminder", true)
          .not("expiry_date", "is", null);

        if (error) throw error;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let mostUrgent: UrgentDoc | null = null;

        data?.forEach(doc => {
          if (!doc.expiry_date) return;

          const expiryDate = new Date(doc.expiry_date);
          const daysUntil = differenceInDays(expiryDate, today);
          const isExpired = isPast(expiryDate) && daysUntil < 0;

          // Show if expired or within 30 days
          if (isExpired || (daysUntil <= 30 && daysUntil >= 0)) {
            if (!mostUrgent || daysUntil < mostUrgent.daysUntil) {
              mostUrgent = {
                documentType: doc.document_type,
                title: documentTitles[doc.document_type] || doc.document_type,
                daysUntil,
                isExpired
              };
            }
          }
        });

        setUrgentDoc(mostUrgent);
      } catch (error) {
        console.error("Error checking documents:", error);
      }
    };

    checkDocuments();
  }, [userId]);

  if (!urgentDoc || dismissed) return null;

  return (
    <div className={`mx-4 mb-3 rounded-xl p-3 flex items-center gap-3 animate-fade-slide-up ${
      urgentDoc.isExpired 
        ? "bg-destructive/10 border border-destructive/30" 
        : "bg-amber-500/10 border border-amber-500/30"
    }`}>
      <AlertTriangle className={`w-5 h-5 shrink-0 ${
        urgentDoc.isExpired ? "text-destructive" : "text-amber-400"
      }`} />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          urgentDoc.isExpired ? "text-destructive" : "text-amber-400"
        }`}>
          {urgentDoc.isExpired 
            ? `${urgentDoc.title} expired`
            : `${urgentDoc.title} expires in ${urgentDoc.daysUntil} day${urgentDoc.daysUntil !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      <button
        onClick={onView}
        className={`text-xs font-medium flex items-center gap-0.5 ${
          urgentDoc.isExpired ? "text-destructive" : "text-amber-400"
        }`}
      >
        View
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-secondary/50 rounded transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default GloveboxBanner;

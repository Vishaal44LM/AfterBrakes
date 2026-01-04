import { useState, useRef } from "react";
import { X, Upload, Trash2, Calendar, Bell, Mail, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { GloveboxDocument } from "./Glovebox";
import { format } from "date-fns";

interface GloveboxSheetProps {
  userId: string;
  documentType: "rc" | "driving_licence" | "insurance" | "puc";
  existingDoc?: GloveboxDocument;
  onClose: () => void;
  onSave: (doc: GloveboxDocument) => void;
}

const documentTitles = {
  rc: "Registration Certificate (RC)",
  driving_licence: "Driving Licence",
  insurance: "Insurance",
  puc: "Pollution Under Control (PUC)"
};

const GloveboxSheet = ({ userId, documentType, existingDoc, onClose, onSave }: GloveboxSheetProps) => {
  const [expiryDate, setExpiryDate] = useState(existingDoc?.expiry_date || "");
  const [inAppReminder, setInAppReminder] = useState(existingDoc?.in_app_reminder || false);
  const [emailReminder, setEmailReminder] = useState(existingDoc?.email_reminder || false);
  const [reminderEmail, setReminderEmail] = useState(existingDoc?.reminder_email || "");
  const [fileUrl, setFileUrl] = useState(existingDoc?.file_url || "");
  const [fileName, setFileName] = useState(existingDoc?.file_name || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPG, PNG, WebP and PDF files are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("glovebox")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("glovebox")
        .getPublicUrl(filePath);

      setFileUrl(urlData.publicUrl);
      setFileName(file.name);

      toast({
        title: "File uploaded",
        description: "Document uploaded successfully"
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (fileUrl) {
      try {
        // Extract path from URL
        const urlParts = fileUrl.split('/glovebox/');
        if (urlParts.length > 1) {
          await supabase.storage.from("glovebox").remove([urlParts[1]]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    setFileUrl("");
    setFileName("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docData: any = {
        user_id: userId,
        document_type: documentType,
        expiry_date: expiryDate || null,
        in_app_reminder: inAppReminder,
        email_reminder: emailReminder,
        reminder_email: emailReminder ? reminderEmail : null,
        file_url: fileUrl || null,
        file_name: fileName || null
      };

      if (existingDoc?.id) {
        const { error } = await supabase
          .from("glovebox_documents")
          .update(docData)
          .eq("id", existingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("glovebox_documents")
          .insert(docData);
        if (error) throw error;
      }

      toast({
        title: "Saved",
        description: "Document details saved successfully"
      });

      onSave(docData);
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearExpiry = async () => {
    setExpiryDate("");
    setInAppReminder(false);
    setEmailReminder(false);
  };

  const handleRemoveReminder = async () => {
    if (existingDoc?.id) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("glovebox_documents")
          .delete()
          .eq("id", existingDoc.id);
        if (error) throw error;

        toast({
          title: "Removed",
          description: "Document removed from glovebox"
        });
        onClose();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to remove document",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    }
  };

  const isImage = fileName?.match(/\.(jpg|jpeg|png|webp)$/i);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className="relative w-full max-w-lg bg-card rounded-t-3xl max-h-[85vh] overflow-hidden animate-actionSheetUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">
            {documentTitles[documentType]}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* Expiry Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4 text-primary" />
              Expiry Date
            </Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="bg-secondary/30 border-border/30"
            />
          </div>

          {/* Reminder Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-primary" />
                In-app reminder
              </Label>
              <Switch
                checked={inAppReminder}
                onCheckedChange={setInAppReminder}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                Email reminder
              </Label>
              <Switch
                checked={emailReminder}
                onCheckedChange={setEmailReminder}
              />
            </div>

            {emailReminder && (
              <Input
                type="email"
                placeholder="Enter your email"
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
                className="bg-secondary/30 border-border/30"
              />
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-primary" />
              Document Upload
            </Label>

            {fileName ? (
              <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-3">
                  {isImage && fileUrl ? (
                    <img 
                      src={fileUrl} 
                      alt="Document" 
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">Tap to replace</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {/* Preview button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="w-full gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview Document
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Upload JPG, PNG or PDF"}
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/30 space-y-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {saving ? "Saving..." : "Save"}
          </Button>

          <div className="flex gap-2">
            {existingDoc?.id && (
              <Button
                variant="ghost"
                onClick={handleRemoveReminder}
                disabled={saving}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleClearExpiry}
              disabled={saving}
              className="flex-1 text-muted-foreground"
            >
              Clear expiry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GloveboxSheet;

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend("re_GR5Xnew7_5vx3WdztCBEiJ8r6CcMch5he");

const documentTitles: Record<string, string> = {
  rc: "Registration Certificate (RC)",
  driving_licence: "Driving Licence",
  insurance: "Insurance",
  puc: "Pollution Under Control (PUC)"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all documents with email reminders enabled
    const { data: documents, error: fetchError } = await supabase
      .from("glovebox_documents")
      .select("*")
      .eq("email_reminder", true)
      .not("expiry_date", "is", null)
      .not("reminder_email", "is", null);

    if (fetchError) throw fetchError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emailsSent: string[] = [];

    for (const doc of documents || []) {
      const expiryDate = new Date(doc.expiry_date);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Send reminder if: expired today, expires tomorrow, or 7 days before, or 30 days before
      const shouldRemind = daysUntil === 0 || daysUntil === 1 || daysUntil === 7 || daysUntil === 30;

      if (shouldRemind && doc.reminder_email) {
        const docTitle = documentTitles[doc.document_type] || doc.document_type;
        
        let subject: string;
        let message: string;

        if (daysUntil <= 0) {
          subject = `⚠️ Your ${docTitle} has expired`;
          message = `Your ${docTitle} expired on ${expiryDate.toLocaleDateString()}. Please renew it as soon as possible to avoid penalties.`;
        } else if (daysUntil === 1) {
          subject = `🚨 Your ${docTitle} expires tomorrow`;
          message = `Your ${docTitle} expires tomorrow (${expiryDate.toLocaleDateString()}). Please renew it immediately.`;
        } else {
          subject = `📅 Your ${docTitle} expires in ${daysUntil} days`;
          message = `Your ${docTitle} will expire on ${expiryDate.toLocaleDateString()}. Plan ahead and renew it before the expiry date.`;
        }

        try {
          await resend.emails.send({
            from: "After Brakes <onboarding@resend.dev>",
            to: [doc.reminder_email],
            subject: subject,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #5A3E99;">After Brakes - Document Reminder</h2>
                <p style="font-size: 16px; color: #333;">${message}</p>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">
                  Visit your After Brakes app to view and manage your documents in the Glovebox.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999;">
                  You're receiving this because you enabled email reminders for this document.
                </p>
              </div>
            `
          });

          emailsSent.push(`${doc.reminder_email} - ${docTitle}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${doc.reminder_email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        details: emailsSent 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Glovebox reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

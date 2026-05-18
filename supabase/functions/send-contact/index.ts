import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const noCtrl = (s: string) => !/[\r\n]/.test(s);
    const ContactSchema = z.object({
      name: z.string().trim().min(1).max(200).refine(noCtrl, "Invalid characters"),
      email: z.string().trim().email().max(254).refine(noCtrl, "Invalid characters"),
      institution: z.string().trim().max(300).refine(noCtrl, "Invalid characters").optional().default(""),
      subject: z.string().trim().min(1).max(300).refine(noCtrl, "Invalid characters"),
      message: z.string().trim().min(1).max(5000),
    });
    const parsed = ContactSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { name, email, institution, subject, message } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save submission to database
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name, email, institution: institution || "", subject, message,
    });
    if (insertError) {
      console.error("Insert error:", insertError);
    }

    // Get SMTP settings
    const { data: smtp } = await supabase
      .from("smtp_settings")
      .select("*")
      .limit(1)
      .single();

    if (!smtp?.enabled) {
      console.log("SMTP disabled — message saved to database only.");
      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "SMTP disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!smtp.host || !smtp.username || !smtp.password || !smtp.from_email) {
      console.log("SMTP incomplete config — message saved to database only.");
      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "SMTP incomplete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email via SMTP
    try {
      const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

      const tlsMode = smtp.encryption_type === "ssl";
      const client = new SMTPClient({
        connection: {
          hostname: smtp.host,
          port: smtp.port,
          tls: tlsMode,
          auth: {
            username: smtp.username,
            password: smtp.password,
          },
        },
      });

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #22c55e; margin-bottom: 24px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #22c55e;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Institution</td><td style="padding: 8px 0;">${institution || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; color: #888;">Subject</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #aaa; font-size: 12px;">Sent from your portfolio contact form</p>
        </div>
      `;

      await client.send({
        from: `${smtp.from_name} <${smtp.from_email}>`,
        to: smtp.from_email,
        replyTo: email,
        subject: `[Contact] ${subject} — ${name}`,
        content: `Name: ${name}\nEmail: ${email}\nInstitution: ${institution}\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: htmlBody,
      });

      await client.close();
      console.log("Email sent successfully via", smtp.host);

      return new Response(JSON.stringify({ success: true, email_sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (smtpError) {
      console.error("SMTP send error:", smtpError);
      // Still return success since message was saved to DB
      return new Response(JSON.stringify({
        success: true,
        email_sent: false,
        reason: "Delivery error",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("Function error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

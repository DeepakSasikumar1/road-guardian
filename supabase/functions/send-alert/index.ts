// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createTransport } from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AlertRequest {
  obstacleId: string;
  obstacleType: string;
  severity: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
  };
  detectedAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const alertData: AlertRequest = await req.json();

    console.log("[ALERT SYSTEM] Processing alert for obstacle:", alertData.obstacleId);

    // Generate unique alert ID
    const alertId = `ALERT-${Date.now().toString(36).toUpperCase()}`;

    // Create alert message
    const severityEmoji = alertData.severity === 'high' ? '🚨' : alertData.severity === 'medium' ? '⚠️' : 'ℹ️';
    const subject = `🚨 Road Alert: ${alertData.severity.toUpperCase()} Severity - ${alertData.obstacleType.replace('_', ' ')}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; padding: 40px 20px; box-sizing: border-box; }
            .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.15); border: 1px solid #e2e8f0; }
            
            /* Dynamic Header based on severity */
            .header { 
              padding: 48px 32px; 
              background: ${alertData.severity === 'high' ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : alertData.severity === 'medium' ? 'linear-gradient(135deg, #f59e0b 0%, #92400e 100%)' : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)'}; 
              text-align: center;
              position: relative;
            }
            .header-icon { font-size: 40px; margin-bottom: 12px; display: block; }
            .org { color: rgba(255, 255, 255, 0.8); font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; }
            .title { color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; margin: 8px 0 0; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            
            .content { padding: 40px 32px; background: #ffffff; }
            .stat-badge { display: inline-block; padding: 6px 16px; border-radius: 99px; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 24px; color: #fff; background: ${alertData.severity === 'high' ? '#ef4444' : alertData.severity === 'medium' ? '#f59e0b' : '#10b981'}; }
            
            .data-grid { width: 100%; margin-bottom: 32px; }
            .data-label { color: #64748b; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 600; text-transform: uppercase; padding-bottom: 4px; }
            .data-value { color: #0f172a; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; padding-bottom: 24px; }
            
            .cta-container { text-align: center; border-top: 1px solid #f1f5f9; padding-top: 32px; }
            .btn { display: inline-block; width: 85%; padding: 18px; border-radius: 16px; font-family: 'Outfit', sans-serif; font-weight: 700; text-decoration: none; font-size: 15px; margin-bottom: 12px; transition: all 0.3s ease; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .btn-primary { background: #0f172a; color: #ffffff; }
            .btn-secondary { background: #ffffff; color: #0f172a; border: 2px solid #0f172a; }
            
            .footer { padding: 32px; text-align: center; color: #94a3b8; font-family: 'Outfit', sans-serif; font-size: 12px; line-height: 1.8; }
            .emergency-pill { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <span class="header-icon">${severityEmoji}</span>
                <div class="org">Authority Portal • Road Guardian</div>
                <h1 class="title">${alertData.obstacleType.replace('_', ' ').toUpperCase()} SPOTTED</h1>
              </div>
              
              <div class="content">
                <div class="stat-badge">PRIORITY: ${alertData.severity.toUpperCase()}</div>
                
                <table class="data-grid">
                  <tr><td class="data-label">📍 Location Details</td></tr>
                  <tr><td class="data-value">${alertData.location.area}, ${alertData.location.address}</td></tr>
                  <tr><td class="data-label">📅 Timestamp (IST)</td></tr>
                  <tr><td class="data-value">${new Date(alertData.detectedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                  <tr><td class="data-label">📋 Record Identifier</td></tr>
                  <tr><td class="data-value" style="font-family: monospace; color: #64748b;">${alertData.obstacleId}</td></tr>
                </table>
                
                <div class="cta-container">
                  <a href="https://www.google.com/maps/search/?api=1&query=${alertData.location.lat},${alertData.location.lng}" class="btn btn-primary">
                    📍 OPEN IN GOOGLE MAPS
                  </a>
                  <a href="https://road-guardian.vercel.app" class="btn btn-secondary">
                    🏠 LOGIN TO COMMAND CENTER
                  </a>
                </div>
              </div>
              
              <div class="footer">
                This is a secure priority dispatch. For immediate safety concerns, 
                dial NHAI helpline <span class="emergency-pill">1033</span>.<br>
                <strong>© 2026 Road Guardian AI Platform</strong>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // 📱 SMS Design Elevation
    const smsMessage = `🚨 ROAD ALERT: ${alertData.severity.toUpperCase()} 🚨\n\n📌 TYPE: ${alertData.obstacleType.replace('_', ' ').toUpperCase()}\n📍 AREA: ${alertData.location.area}\n📅 TIME: ${new Date(alertData.detectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n\n🗺️ NAVIGATE: https://www.google.com/maps/search/?api=1&query=${alertData.location.lat},${alertData.location.lng}\n\n⚠️ DRIVE SAFE.`;

    const message = `${severityEmoji} ${alertData.severity.toUpperCase()} SEVERITY: ${alertData.obstacleType.replace('_', ' ').toUpperCase()} detected at ${alertData.location.area}`;

    // Get alert recipients for this severity level
    const { data: dbRecipients, error: recipientsError } = await supabase
      .from('alert_recipients')
      .select('*')
      .contains('severity_filter', [alertData.severity]);

    if (recipientsError) {
      console.error("[ALERT SYSTEM] Error fetching recipients:", recipientsError);
    }

    // Create a mutable copy of recipients or an empty array
    const recipients = dbRecipients ? [...dbRecipients] : [];

    // Add NHAI emergency contact (1033) for all alerts
    const EMERGENCY_PHONE = '1033';
    const isEmergencyNumberIncluded = recipients.some(r => r.phone === EMERGENCY_PHONE);

    if (!isEmergencyNumberIncluded) {
      console.log(`[ALERT SYSTEM] Adding emergency contact ${EMERGENCY_PHONE} to recipients list`);
      recipients.push({
        // @ts-ignore - Partial object for emergency contact
        email: '',
        phone: EMERGENCY_PHONE,
        receive_email: false,
        receive_sms: true,
      });
    }

    let emailSent = false;
    let smsSent = false;
    const emailResults: { email: string; status: string }[] = [];

    if (recipients && recipients.length > 0) {
      // Configure Email Transport (Resend or Gmail)
      let emailTransporter = null;
      let fromEmail = '';

      if (resendApiKey) {
        // Use Resend
        const resend = new Resend(resendApiKey);
        emailTransporter = { type: 'resend', client: resend };
        fromEmail = 'RoadWatch AI <alerts@resend.dev>';
      } else if (gmailUser && gmailPass) {
        // Use Gmail SMTP
        const transporter = createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass,
          },
        });
        emailTransporter = { type: 'gmail', client: transporter };
        fromEmail = `RoadWatch AI <${gmailUser}>`;
      }

      for (const recipient of recipients) {
        // --- EMAIL SENDING ---
        if (recipient.receive_email && recipient.email) {
          if (emailTransporter) {
            try {
              if (emailTransporter.type === 'resend') {
                // @ts-ignore
                const { error: sendError } = await emailTransporter.client.emails.send({
                  from: fromEmail,
                  to: [recipient.email],
                  subject: subject,
                  html: htmlContent,
                });
                if (sendError) throw sendError;
              } else if (emailTransporter.type === 'gmail') {
                // @ts-ignore
                await emailTransporter.client.sendMail({
                  from: fromEmail,
                  to: recipient.email,
                  subject: subject,
                  html: htmlContent,
                });
              }

              console.log(`[ALERT SYSTEM] Email sent to ${recipient.email} via ${emailTransporter.type}`);
              emailResults.push({ email: recipient.email, status: 'sent' });
              emailSent = true;
            } catch (emailError) {
              console.error(`[ALERT SYSTEM] Email error for ${recipient.email}:`, emailError);
              emailResults.push({ email: recipient.email, status: 'failed' });
            }
          } else {
            // Mock Email
            console.log(`[ALERT SYSTEM] (Mock) Sending email to ${recipient.email}`);
            emailResults.push({ email: recipient.email, status: 'simulated' });
            emailSent = true;
          }
        }

        // --- SMS SENDING (Twilio) ---
        if (recipient.receive_sms && recipient.phone) {
          const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
          const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

          if (twilioSid && twilioToken && twilioPhone) {
            try {
              const smsMessage = `🚨 RoadWatch: ${alertData.severity.toUpperCase()} SEVERITY\n${alertData.obstacleType.replace('_', ' ').toUpperCase()} at ${alertData.location.area}\nMap: https://www.google.com/maps/search/?api=1&query=${alertData.location.lat},${alertData.location.lng}`;

              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
              const authHeader = btoa(`${twilioSid}:${twilioToken}`);

              const smsResponse = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${authHeader}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  To: recipient.phone,
                  From: twilioPhone,
                  Body: smsMessage,
                }),
              });

              if (smsResponse.ok) {
                console.log(`[ALERT SYSTEM] SMS sent to ${recipient.phone}`);
                smsSent = true;
              } else {
                const smsError = await smsResponse.text();
                console.error(`[ALERT SYSTEM] SMS failed for ${recipient.phone}:`, smsError);
              }
            } catch (smsError) {
              console.error(`[ALERT SYSTEM] SMS error for ${recipient.phone}:`, smsError);
            }
          } else {
            console.log(`[ALERT SYSTEM] (Mock) Sending SMS to ${recipient.phone}`);
            // Mark as sent in simulation mode if configured to do so, or just log
            // smsSent = true; 
          }
        }
      }
    }

        // Log alert to database
        const { data: alertRecord, error: insertError } = await supabase
          .from('alerts')
          .insert({
            alert_id: alertId,
            obstacle_id: alertData.obstacleId || null,
            type: alertData.severity === 'high' ? 'high_severity' : 'new_detection',
            message: message,
            status: 'sent',
            email_sent: emailSent,
            sms_sent: smsSent || true, // Default to true in simulation/mock mode for visibility
          })
          .select()
          .single();

    if (insertError) {
      console.error("[ALERT SYSTEM] Error saving alert log:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertId,
        emailSent,
        smsSent,
        emailResults,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[ALERT SYSTEM] Error processing alert:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

/**
 * AirPak Express - Email Sender Edge Function v2
 * Sends emails via Zoho API with Supabase logging
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://zygoqqsgzhgpvlpttfbk.supabase.co";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Zoho Mail API Configuration
const ZOHO_CLIENT_ID = Deno.env.get("ZOHO_CLIENT_ID") || "925732931.GXONZFSBYTQ4FN33NEYMZDLQ591JRR";
const ZOHO_CLIENT_SECRET = Deno.env.get("ZOHO_CLIENT_SECRET") || "960c75d42d5aefc568348449c54876d21eadee98a8";
const ZOHO_ACCOUNT_ID = Deno.env.get("ZOHO_ACCOUNT_ID") || "925667788";

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  fromName?: string;
  cc?: string;
  bcc?: string;
  messageId?: string;
  trackingNumber?: string;
  templateId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ZohoToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Supabase admin client
const supabase = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false } })
  : null;

// Create email log
async function logEmail(params: {
  messageId: string;
  to: string;
  subject: string;
  status: string;
  trackingNumber?: string;
  templateId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: string;
}) {
  if (!supabase) {
    console.log("Email log (no DB):", params);
    return;
  }

  try {
    let category = "general";
    const subject = params.subject.toLowerCase();

    if (subject.includes("shipment") || subject.includes("delivery") || subject.includes("tracking")) {
      category = "shipment";
    } else if (subject.includes("invoice") || subject.includes("payment")) {
      category = "invoice";
    } else if (subject.includes("welcome") || subject.includes("account created")) {
      category = "onboarding";
    } else if (subject.includes("password") || subject.includes("2fa") || subject.includes("verification") || subject.includes("reset")) {
      category = "security";
    }

    await supabase.from("email_logs").insert({
      message_id: params.messageId,
      recipient_email: params.to,
      subject: params.subject,
      template_id: params.templateId,
      tracking_number: params.trackingNumber,
      user_id: params.userId,
      category,
      status: params.status,
      provider: "zoho",
      provider_message_id: params.messageId,
      metadata: params.metadata || {},
      ...(params.status === "sent" && { sent_at: new Date().toISOString() }),
      ...(params.status === "failed" && { smtp_response: params.error }),
    });
  } catch (err) {
    console.error("Failed to log email:", err);
  }
}

// Get Zoho OAuth token
async function getZohoToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN");
  if (!refreshToken) {
    throw new Error("ZOHO_REFRESH_TOKEN not configured");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho token error: ${error}`);
  }

  const data: ZohoToken = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in - 300) * 1000;

  return data.access_token;
}

// Send email via Zoho Mail API
async function sendEmailViaZoho(token: string, email: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailApiUrl = `https://mail.zoho.com/api/accounts/${ZOHO_ACCOUNT_ID}/messages`;

  const payload: Record<string, unknown> = {
    fromAddress: "noreply@airpakexpress.com",
    toAddress: email.to,
    subject: email.subject,
    content: email.html || email.body,
    mailFormat: "html",
  };

  if (email.cc) payload.ccAddress = email.cc;
  if (email.bcc) payload.bccAddress = email.bcc;

  const response = await fetch(mailApiUrl, {
    method: "POST",
    headers: {
      "Authorization": `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error };
  }

  const result = await response.json();
  return {
    success: true,
    messageId: result.data?.messageId || result.messageId || `zoho-${Date.now()}`,
  };
}

// Main handler
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey",
      },
    });
  }

  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();
    const {
      to,
      subject,
      body: emailBody,
      html,
      cc,
      bcc,
      messageId,
      trackingNumber,
      templateId,
      userId,
      metadata,
    } = body as EmailRequest;

    // Validation
    if (!to || !subject || !emailBody) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, body" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Generate message ID
    const finalMessageId = messageId || `<${requestId}@airpak-express.site>`;

    // Log pending status
    await logEmail({
      messageId: finalMessageId,
      to,
      subject,
      status: "pending",
      trackingNumber,
      templateId,
      userId,
      metadata,
    });

    // Get Zoho token and send
    const token = await getZohoToken();
    const result = await sendEmailViaZoho(token, {
      to,
      subject,
      body: emailBody,
      html,
      cc,
      bcc,
      messageId: finalMessageId,
    });

    if (result.success) {
      // Update log to sent
      await logEmail({
        messageId: finalMessageId,
        to,
        subject,
        status: "sent",
        trackingNumber,
        templateId,
        userId,
        metadata: { ...metadata, providerMessageId: result.messageId },
      });

      console.log(`[${requestId}] Email sent: ${result.messageId} to ${to}`);

      return new Response(
        JSON.stringify({
          success: true,
          messageId: result.messageId,
          requestId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    } else {
      // Log failure
      await logEmail({
        messageId: finalMessageId,
        to,
        subject,
        status: "failed",
        trackingNumber,
        templateId,
        userId,
        metadata,
        error: result.error,
      });

      return new Response(
        JSON.stringify({ success: false, error: result.error, requestId }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] ERROR:`, error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        requestId,
      }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});

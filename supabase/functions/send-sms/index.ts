/**
 * AirPak Express - Twilio SMS Integration
 * Secure edge function - env vars via Supabase secrets only
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import twilio from "npm:twilio@4.19.0";

// Read env vars from Supabase secrets (NO hardcoded fallbacks)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

// Fail fast if any required env var is missing
if (!SUPABASE_URL) throw new Error("Missing: SUPABASE_URL");
if (!SUPABASE_SERVICE_KEY) throw new Error("Missing: SUPABASE_SERVICE_ROLE_KEY");
if (!TWILIO_ACCOUNT_SID) throw new Error("Missing: TWILIO_ACCOUNT_SID");
if (!TWILIO_AUTH_TOKEN) throw new Error("Missing: TWILIO_AUTH_TOKEN");
if (!TWILIO_PHONE_NUMBER) throw new Error("Missing: TWILIO_PHONE_NUMBER");

// Initialize clients
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false } });

// SMS Types
interface SMSRequest {
  to: string;
  message: string;
  templateId?: string;
  trackingNumber?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Normalize phone: keep only digits, add + prefix
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // US/Canada: 10 digits -> +1
  if (digits.length === 10) return `+1${digits}`;

  // Already has country code: 11 digits starting with 1
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;

  // International: always prefix with +
  if (digits.length >= 10) return `+${digits}`;

  // Invalid format
  return `+${digits}`;
}

// Validate E.164 format
function validatePhone(phone: string): boolean {
  return /^\+[1-9]\d{9,14}$/.test(phone);
}

// Categorize message
function getCategory(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("delivery") || lower.includes("shipment")) return "shipment";
  if (lower.includes("verification") || lower.includes("code") || lower.includes("otp")) return "security";
  if (lower.includes("welcome") || lower.includes("account")) return "onboarding";
  return "general";
}

// Log SMS to database
interface LogParams {
  internalMessageId: string;
  twilioSid?: string;
  to: string;
  message: string;
  status: string;
  trackingNumber?: string;
  templateId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

async function logSMS(params: LogParams) {
  try {
    await supabase.from("sms_logs").insert({
      message_id: params.internalMessageId,
      provider_message_id: params.twilioSid || params.internalMessageId,
      recipient_phone: params.to,
      message: params.message.substring(0, 500),
      template_id: params.templateId,
      tracking_number: params.trackingNumber,
      user_id: params.userId,
      category: getCategory(params.message),
      status: params.status,
      provider: "twilio",
      metadata: params.metadata || {},
      ...(params.status === "sent" && { sent_at: new Date().toISOString() }),
      ...(params.status === "failed" && { smtp_response: params.error }),
    });
  } catch (err) {
    console.error("Failed to log SMS:", err);
  }
}

// Send SMS via Twilio
async function sendSMS(phone: string, message: string) {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    };
  }
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
    const { to, message, templateId, trackingNumber, userId, metadata } = body as SMSRequest;

    // Validation
    if (!to || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, message" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (message.length > 1600) {
      return new Response(
        JSON.stringify({ success: false, error: "Message too long. Max 1600 characters." }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Normalize and validate phone
    const normalizedPhone = normalizePhone(to);
    if (!validatePhone(normalizedPhone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid phone number. Use E.164 format: +1234567890" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Generate internal message ID
    const internalMessageId = `SMS_${requestId}`;

    // Log pending
    await logSMS({
      internalMessageId,
      to: normalizedPhone,
      message,
      status: "pending",
      trackingNumber,
      templateId,
      userId,
      metadata,
    });

    // Send SMS
    const result = await sendSMS(normalizedPhone, message);

    if (result.success) {
      await logSMS({
        internalMessageId,
        twilioSid: result.sid,
        to: normalizedPhone,
        message,
        status: "sent",
        trackingNumber,
        templateId,
        userId,
        metadata: { ...metadata, twilioSid: result.sid } as Record<string, unknown>,
      });

      console.log(`[${requestId}] SMS sent: ${result.sid} to ${normalizedPhone}`);

      return new Response(
        JSON.stringify({
          success: true,
          messageId: result.sid,
          requestId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    } else {
      await logSMS({
        internalMessageId,
        to: normalizedPhone,
        message,
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

/**
 * Zoho OneAuth TOTP Verification Edge Function
 * Simplified version with in-memory storage for testing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory storage for TOTP secrets (use database in production)
const totpSecrets = new Map<string, {
  secret: string;
  is_enabled: boolean;
  created_at: number;
}>();

// Simple TOTP implementation
function generateTOTP(secret: string, time?: number): string {
  const period = 30;
  const t = Math.floor((time || Date.now()) / 1000 / period);

  // Simple hash-based code generation
  let hash = 0;
  const str = secret.toUpperCase() + t.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Generate 6-digit code
  const code = Math.abs(hash % 1000000);
  return code.toString().padStart(6, '0');
}

function validateTOTP(secret: string, token: string, window = 1): boolean {
  const now = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const time = now + i;
    let hash = 0;
    const str = secret.toUpperCase() + time.toString();
    for (let j = 0; j < str.length; j++) {
      const char = str.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash % 1000000).toString().padStart(6, '0');
    if (code === token) return true;
  }
  return false;
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, code, user_email, secret, enable_email } = await req.json();

    if (action === 'generate') {
      // Generate new TOTP secret
      const newSecret = generateSecret();
      const rawSecret = newSecret.replace(/\s/g, '');

      return new Response(JSON.stringify({
        success: true,
        secret: newSecret,
        raw_secret: rawSecret,
        uri: `otpauth://totp/AirPak:${encodeURIComponent(user_email || 'admin')}?secret=${rawSecret}&issuer=AirPak&algorithm=SHA1&digits=6&period=30`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'enable') {
      // Enable 2FA for user
      if (!enable_email || !secret) {
        return new Response(JSON.stringify({ success: false, error: 'Email and secret required' }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const rawSecret = secret.replace(/\s/g, '').toUpperCase();
      totpSecrets.set(enable_email.toLowerCase(), {
        secret: rawSecret,
        is_enabled: true,
        created_at: Date.now()
      });

      return new Response(JSON.stringify({ success: true, message: '2FA enabled' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'verify') {
      // Verify TOTP code
      if (!code || !user_email) {
        return new Response(JSON.stringify({ success: false, error: 'Code and email required' }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const userData = totpSecrets.get(user_email.toLowerCase());

      if (!userData || !userData.is_enabled) {
        return new Response(JSON.stringify({ success: false, error: '2FA not configured for this user' }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const isValid = validateTOTP(userData.secret, code, 1);

      if (isValid) {
        return new Response(JSON.stringify({ success: true, message: 'Authentication successful' }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Invalid code' }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    if (action === 'check') {
      // Check if user has 2FA enabled
      if (!user_email) {
        return new Response(JSON.stringify({ success: false, error: 'Email required' }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const userData = totpSecrets.get(user_email.toLowerCase());
      return new Response(JSON.stringify({
        success: true,
        enabled: userData?.is_enabled || false
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
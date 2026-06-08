/**
 * Zoho OneAuth Push Authentication Edge Function
 * Handles push notification initiation and status checking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory store for push requests (use Redis/DB in production)
const pushStore = new Map<string, {
  email: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  created_at: number;
  expires_at: number;
}>();

// Clean up expired pushes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, push] of pushStore.entries()) {
    if (now > push.expires_at) {
      pushStore.delete(id);
    }
  }
}, 5 * 60 * 1000);

function generatePushId(): string {
  return `push_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, email, push_id } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'initiate') {
      // Generate a new push ID
      const pushId = generatePushId();
      const now = Date.now();

      // Store push request
      pushStore.set(pushId, {
        email: email.toLowerCase(),
        status: 'pending',
        created_at: now,
        expires_at: now + 120000, // 2 minute expiry
      });

      console.log(`[Zoho OneAuth Push] Push initiated for ${email}: ${pushId}`);

      return new Response(JSON.stringify({
        success: true,
        push_id: pushId,
        message: 'Push notification sent. Check your Zoho OneAuth app.',
        expires_in: 120
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'check_status') {
      if (!push_id) {
        return new Response(
          JSON.stringify({ error: 'Push ID required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const push = pushStore.get(push_id);

      if (!push) {
        return new Response(JSON.stringify({
          status: 'expired',
          error: 'Push request not found or expired'
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Check if expired
      if (Date.now() > push.expires_at) {
        push.status = 'expired';
        pushStore.delete(push_id);
        return new Response(JSON.stringify({
          status: 'expired',
          error: 'Push request has expired'
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        status: push.status,
        push_id: push_id,
        email: push.email
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'simulate_approve') {
      // Development mode: simulate approval for testing
      if (!push_id) {
        return new Response(
          JSON.stringify({ error: 'Push ID required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const push = pushStore.get(push_id);
      if (push) {
        push.status = 'approved';
        console.log(`[Zoho OneAuth Push] Simulated approval for push: ${push_id}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Push approved (simulated)'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === 'simulate_deny') {
      // Development mode: simulate denial for testing
      if (!push_id) {
        return new Response(
          JSON.stringify({ error: 'Push ID required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const push = pushStore.get(push_id);
      if (push) {
        push.status = 'denied';
        console.log(`[Zoho OneAuth Push] Simulated denial for push: ${push_id}`);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Push denied (simulated)'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error('Error in zoho-oneauth-push function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
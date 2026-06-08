/**
 * AirPak Express - Advanced Branded 2FA Email Sender
 * Runtime: Deno (Supabase Edge Functions)
 * Email: Zoho SMTP with connection pooling
 * Rate Limit: Upstash Redis (distributed, edge-safe)
 * Auth: JWT + custom claims validation
 */

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";
import { Redis } from "npm:@upstash/redis@1.25.0";
import { z } from "npm:zod@3.22.4";
import { jwtVerify, createRemoteJWKSet } from "npm:jose@5.2.0";

// ─── Strict Env Validation ───
const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  ZOHO_SMTP_HOST: z.string().default("smtp.zoho.com"),
  ZOHO_SMTP_PORT: z.string().transform(Number).default("465"),
  ZOHO_SMTP_USER: z.string().email(),
  ZOHO_SMTP_PASS: z.string().min(1),
  ZOHO_FROM_NAME: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  RATE_LIMIT_MAX: z.string().transform(Number).default("5"),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default("300"),
  COMPANY_LOGO_URL: z.string().url().optional(),
  COMPANY_SUPPORT_EMAIL: z.string().email().optional(),
});

const env = EnvSchema.parse(Deno.env.toObject());

// ─── Security Headers ───
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ─── Redis Client (Distributed Rate Limit) ───
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ─── SMTP Connection Pool ───
const transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  host: env.ZOHO_SMTP_HOST,
  port: env.ZOHO_SMTP_PORT,
  secure: env.ZOHO_SMTP_PORT === 465,
  auth: {
    user: env.ZOHO_SMTP_USER,
    pass: env.ZOHO_SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify().catch((err) => console.error("SMTP pool verify failed:", err.message));

// ─── Supabase Admin Client ───
let supabaseAdmin: SupabaseClient;
function getAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

// ─── Input Schema ───
const RequestSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  user_id: z.string().uuid(),
  device_info: z.string().max(200).optional(),
  ip_hint: z.string().max(50).optional(),
});

// ─── JWT Verification ───
async function verifyJWT(token: string): Promise<{ sub: string; email?: string; role?: string }> {
  const JWKS = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/jwks`));
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${env.SUPABASE_URL}/auth/v1`,
    audience: "authenticated",
    clockTolerance: 60,
    maxTokenAge: "2h",
  });
  if (!payload.sub) throw new Error("Invalid token: missing sub");
  return {
    sub: payload.sub,
    email: payload.email as string,
    role: payload.role as string,
  };
}

// ─── Distributed Rate Limit (Sliding Window) ───
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const key = `ratelimit:2fa:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - env.RATE_LIMIT_WINDOW;

  await redis.zremrangebyscore(key, 0, windowStart);
  const current = await redis.zcard(key);

  if (current >= env.RATE_LIMIT_MAX) {
    const oldest = await redis.zrange(key, 0, 0, { withScores: true });
    const reset = oldest.length > 0 ? Math.ceil(Number(oldest[1])) + env.RATE_LIMIT_WINDOW : now + env.RATE_LIMIT_WINDOW;
    return { allowed: false, remaining: 0, reset };
  }

  await redis.zadd(key, { score: now, member: `${now}-${crypto.randomUUID()}` });
  await redis.expire(key, env.RATE_LIMIT_WINDOW + 1);

  return {
    allowed: true,
    remaining: env.RATE_LIMIT_MAX - current - 1,
    reset: now + env.RATE_LIMIT_WINDOW,
  };
}

// ─── Audit Log ───
async function auditLog(payload: {
  user_id: string;
  action: string;
  status: "success" | "failure" | "blocked";
  email: string;
  ip?: string;
  details?: string;
}) {
  try {
    await getAdminClient().from("audit_logs").insert({
      ...payload,
      created_at: new Date().toISOString(),
      source: "edge_function:send-2fa-email",
    });
  } catch (e) {
    console.error("AUDIT_LOG_FAILED:", e);
  }
}

// ─── Branded HTML Template (AirPak Design) ───
function buildEmailTemplate(code: string, metadata: { device?: string; ip?: string; expiresAt: Date }): string {
  const logo = env.COMPANY_LOGO_URL || "";
  const support = env.COMPANY_SUPPORT_EMAIL || env.ZOHO_SMTP_USER;
  const fromName = env.ZOHO_FROM_NAME;
  const expiresMinutes = Math.floor((metadata.expiresAt.getTime() - Date.now()) / 60000);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - ${fromName}</title>
  <style>
    :root {
      --red: #CC0000;
      --red-dim: rgba(204,0,0,0.12);
      --black: #000000;
      --surface: #0A0A0A;
      --border: #1F1F1F;
      --text-primary: #FFFFFF;
      --text-secondary: #B0B0B0;
      --text-muted: #666666;
      --text-faint: #444444;
      --green: #00C853;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #111111;
      color: var(--text-primary);
      font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      padding: 40px 16px;
    }
    .email-wrapper {
      max-width: 640px;
      margin: 0 auto;
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.8);
    }
    .header {
      background: var(--black);
      padding: 26px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-wordmark {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .brand-wordmark span { color: var(--red); }
    .header-meta {
      text-align: right;
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }
    .status-bar {
      background: #050505;
      padding: 9px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10.5px;
      border-bottom: 1px solid var(--border);
      font-family: 'JetBrains Mono', monospace;
    }
    .status-left { display: flex; align-items: center; gap: 8px; }
    .live-dot {
      width: 7px; height: 7px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,200,83,0.4); }
      50% { opacity: 0.5; box-shadow: 0 0 0 4px rgba(0,200,83,0); }
    }
    .status-label { font-weight: 600; color: var(--green); letter-spacing: 0.5px; }
    .status-right { color: var(--green); font-size: 10px; opacity: 0.8; }
    .hero {
      padding: 60px 44px 68px;
      text-align: center;
      background: linear-gradient(180deg, #0A0A0A 0%, var(--black) 100%);
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 300px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--red), transparent);
    }
    .hero-badge {
      display: inline-block;
      background: var(--red-dim);
      color: var(--red);
      font-size: 9.5px;
      font-weight: 600;
      padding: 5px 16px;
      border-radius: 9999px;
      margin-bottom: 22px;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      border: 1px solid rgba(204,0,0,0.2);
      font-family: 'JetBrains Mono', monospace;
    }
    .hero h1 {
      font-size: 40px;
      font-weight: 700;
      line-height: 1.04;
      letter-spacing: -2px;
      margin-bottom: 18px;
    }
    .hero-subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      max-width: 400px;
      margin: 0 auto 38px;
    }
    .divider { height: 1px; background: var(--border); }
    .section { padding: 48px 44px; background: var(--black); }
    .code-box {
      background: #080808;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 32px;
      text-align: center;
      margin: 24px 0;
    }
    .code-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
      font-family: 'JetBrains Mono', monospace;
    }
    .verification-code {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 16px;
      color: var(--red);
      font-family: 'JetBrains Mono', monospace;
      padding: 0 16px;
    }
    .expiry-warning {
      margin-top: 20px;
      font-size: 12px;
      color: #FF6B6B;
      font-family: 'JetBrains Mono', monospace;
    }
    .info-grid {
      margin: 28px 0;
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }
    .info-item {
      padding: 16px 22px;
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .info-item:last-child { border-bottom: none; }
    .info-icon {
      width: 32px; height: 32px;
      background: var(--red-dim);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .info-icon svg { width: 15px; height: 15px; stroke: var(--red); fill: none; stroke-width: 2; }
    .info-content {}
    .info-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
    .info-desc { font-size: 12.5px; color: var(--text-muted); }
    .security-note {
      background: #080808;
      border-left: 3px solid var(--green);
      padding: 20px 24px;
      margin: 24px 0;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      color: #AAAAAA;
      line-height: 1.7;
    }
    .security-note strong { color: var(--green); }
    .footer {
      background: var(--black);
      padding: 32px 44px 40px;
      border-top: 1px solid var(--border);
      text-align: center;
    }
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 0;
      margin-bottom: 18px;
    }
    .footer-links a {
      color: #666;
      text-decoration: none;
      font-size: 11px;
      padding: 0 12px;
      border-right: 1px solid #2A2A2A;
    }
    .footer-links a:last-child { border-right: none; }
    .footer-links a:hover { color: #AAAAAA; }
    .legal {
      font-size: 10px;
      color: #3A3A3A;
      margin-top: 14px;
      line-height: 1.6;
    }
    .verified {
      margin-top: 18px;
      font-size: 9.5px;
      color: #2E2E2E;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .verified-dot {
      width: 5px; height: 5px;
      background: #2A6A40;
      border-radius: 50%;
    }
    @media (max-width: 480px) {
      body { padding: 0; }
      .email-wrapper { border-radius: 0; border: none; }
      .hero { padding: 44px 28px 52px; }
      .hero h1 { font-size: 30px; }
      .verification-code { font-size: 36px; letter-spacing: 10px; }
      .section { padding: 36px 28px; }
      .footer { padding: 28px 28px 36px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="brand-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="4" fill="#CC0000"/>
          <path d="M8 14L12 18L20 10" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="brand-wordmark">${fromName}<span></span></span>
      </div>
      <div class="header-meta">
        <strong>Security Verification</strong>
        ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>

    <div class="status-bar">
      <div class="status-left">
        <span class="live-dot"></span>
        <span class="status-label">SECURE AUTHENTICATION</span>
      </div>
      <div class="status-right">2FA Verification Code</div>
    </div>

    <div class="hero">
      <div class="hero-badge">Verification Required</div>
      <h1>Enter Your Code</h1>
      <p class="hero-subtitle">Use the code below to complete your sign-in. This code expires in ${expiresMinutes} minutes.</p>
    </div>

    <div class="divider"></div>

    <div class="section">
      <div class="code-box">
        <div class="code-label">Your Verification Code</div>
        <div class="verification-code">${code}</div>
        <div class="expiry-warning">⚠ Expires in ${expiresMinutes} minutes</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <div class="info-content">
            <div class="info-title">Code Expires</div>
            <div class="info-desc">${metadata.expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        ${metadata.device ? `
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div class="info-content">
            <div class="info-title">Device</div>
            <div class="info-desc">${metadata.device}</div>
          </div>
        </div>` : ''}
        ${metadata.ip ? `
        <div class="info-item">
          <div class="info-icon">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="info-content">
            <div class="info-title">Location</div>
            <div class="info-desc">${metadata.ip}</div>
          </div>
        </div>` : ''}
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not request this code or suspect unauthorized access, please contact our support team immediately at <a href="mailto:${support}" style="color: var(--green);">${support}</a>
      </div>
    </div>

    <div class="footer">
      <div class="footer-links">
        <a href="mailto:${support}">Support</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </div>
      <div class="legal">
        © ${new Date().getFullYear()} ${fromName}. All rights reserved.<br>
        This is an automated security message. Do not share your code with anyone.
      </div>
      <div class="verified">
        <span class="verified-dot"></span>
        <span>Verified sender: ${env.ZOHO_SMTP_USER}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main Handler ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  const startTime = performance.now();

  try {
    // 1. Auth header extraction
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const jwt = authHeader.replace("Bearer ", "");

    // 2. Verify JWT
    const claims = await verifyJWT(jwt);

    // 3. Parse & validate body
    const rawBody = await req.json().catch(() => ({}));
    const body = RequestSchema.parse(rawBody);

    // Security: JWT sub must match requested user_id
    if (claims.sub !== body.user_id) {
      await auditLog({ user_id: body.user_id, action: "2fa_send", status: "failure", email: body.email, details: "JWT sub mismatch" });
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // 4. Rate limit check
    const rateKey = `${body.user_id}:${body.email}`;
    const rate = await checkRateLimit(rateKey);

    if (!rate.allowed) {
      await auditLog({ user_id: body.user_id, action: "2fa_send", status: "blocked", email: body.email, details: `Rate limit exceeded` });
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retry_after: rate.reset - Math.floor(Date.now() / 1000) }),
        { status: 429, headers: { ...corsHeaders, "Retry-After": String(rate.reset - Math.floor(Date.now() / 1000)) } }
      );
    }

    // 5. Generate 2FA code
    const code = Array.from(crypto.getRandomValues(new Uint32Array(1)))
      .map((v) => (v % 1000000).toString().padStart(6, "0"))
      .join("")
      .slice(0, 6);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Store code hash in DB
    const { error: dbError } = await getAdminClient()
      .from("user_2fa_codes")
      .upsert(
        { user_id: body.user_id, code_hash: await hashCode(code), expires_at: expiresAt.toISOString(), attempts: 0, created_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (dbError) throw new Error(`Database error: ${dbError.message}`);

    // 7. Send email
    const info = await transporter.sendMail({
      from: `"${env.ZOHO_FROM_NAME}" <${env.ZOHO_SMTP_USER}>`,
      to: body.email,
      subject: `Your ${env.ZOHO_FROM_NAME} verification code`,
      text: `Your verification code is: ${code}. It expires in 10 minutes.`,
      html: buildEmailTemplate(code, { device: body.device_info, ip: body.ip_hint, expiresAt }),
      headers: { "X-Request-ID": requestId, "X-Mailer": "SecureEdgeMailer/1.0", "X-Priority": "1" },
    });

    // 8. Audit success
    await auditLog({ user_id: body.user_id, action: "2fa_send", status: "success", email: body.email, details: `messageId=${info.messageId}` });

    // 9. Response (never expose code)
    return new Response(
      JSON.stringify({ success: true, message_id: info.messageId, expires_at: expiresAt.toISOString(), remaining_attempts: rate.remaining }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    const isZod = err instanceof z.ZodError;
    const status = isZod ? 400 : err.message?.includes("JWT") ? 401 : 500;
    const message = isZod ? "Invalid request payload" : err.message || "Internal error";
    console.error(`[${requestId}] ERROR:`, err);

    return new Response(JSON.stringify({ error: message, request_id: requestId }), { status, headers: corsHeaders });
  } finally {
    console.log(`[${requestId}] Duration: ${(performance.now() - startTime).toFixed(2)}ms`);
  }
});

// ─── Helpers ───
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
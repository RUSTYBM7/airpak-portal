# AirPak 2FA System - Deployment Guide

## Completed ✅

1. **2FA Edge Function Created** - Production-ready Deno edge function at:
   `/workspace/airpak-admin/supabase/functions/send-2fa-email/index.ts`

2. **Database Migration SQL Created** - Ready at:
   `/workspace/airpak-admin/supabase/migrations/20260528_2fa_table.sql`

---

## Manual Steps Required (Supabase Dashboard)

### Step 1: Create Database Table

Go to **Supabase Dashboard > SQL Editor** and run:

```sql
-- Create 2FA codes table
CREATE TABLE IF NOT EXISTS public.user_2fa_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disable RLS for admin access
ALTER TABLE public.user_2fa_codes DISABLE ROW LEVEL SECURITY;

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_2fa_expires ON public.user_2fa_codes(expires_at);
```

### Step 2: Deploy Edge Function

1. Go to **Supabase Dashboard > Edge Functions**
2. Click **Deploy Edge Function**
3. Select the `send-2fa-email` function from:
   `/workspace/airpak-admin/supabase/functions/send-2fa-email/index.ts`

### Step 3: Configure Edge Function Secrets

Go to **Supabase Dashboard > Edge Functions > send-2fa-email > Secrets** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ZOHO_SMTP_HOST` | `smtp.zoho.com` | Zoho SMTP server |
| `ZOHO_SMTP_PORT` | `465` | SMTP port (SSL) |
| `ZOHO_SMTP_USER` | `your@email.com` | Zoho email address |
| `ZOHO_SMTP_PASS` | `your-app-password` | Zoho app-specific password |
| `ZOHO_FROM_NAME` | `AirPak Express` | Email sender name |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | `xxx` | Upstash Redis token |
| `COMPANY_SUPPORT_EMAIL` | `support@airpak-express.site` | Support email |

### Step 4: Test the Function

After deployment, test with:

```bash
curl -X POST "https://zygoqqsgzhgpvlpttfbk.supabase.co/functions/v1/send-2fa-email" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "user_id": "USER_UUID",
    "device_info": "Chrome on Windows",
    "ip_hint": "192.168.1.1"
  }'
```

---

## Edge Function Features

- **Rate Limiting**: 5 requests per 5 minutes (configurable)
- **Secure Code Generation**: 6-digit cryptographically random codes
- **Code Hashing**: SHA-256 hash before storage
- **AirPak Branding**: Dark-themed professional email template
- **Audit Logging**: Full audit trail in `audit_logs` table
- **SMTP Pooling**: Connection pooling for better performance
- **JWT Validation**: Verifies caller identity

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/send-2fa-email/index.ts` | Edge function code |
| `supabase/migrations/20260528_2fa_table.sql` | Database schema |

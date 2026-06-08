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

-- Function to clean expired codes
CREATE OR REPLACE FUNCTION public.clean_expired_2fa_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_2fa_codes WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.user_2fa_codes TO postgres;
GRANT ALL ON public.user_2fa_codes TO service_role;
GRANT ALL ON public.clean_expired_2fa_codes TO postgres;
GRANT ALL ON public.clean_expired_2fa_codes TO service_role;

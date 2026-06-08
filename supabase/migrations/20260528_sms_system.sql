-- AirPak Express SMS System Database Schema
-- Twilio SMS integration with logging

-- SMS Logs Table
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE NOT NULL,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_id TEXT,
  tracking_number TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  provider TEXT DEFAULT 'twilio',
  provider_message_id TEXT,
  smtp_response TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  max_length INT DEFAULT 160,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS Schedules Table
CREATE TABLE IF NOT EXISTS public.sms_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.sms_templates(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('immediate', 'scheduled', 'recurring', 'event')),
  event_type TEXT,
  delay_minutes INT DEFAULT 0,
  cron_expression TEXT,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS Events Table (for delivery status updates)
CREATE TABLE IF NOT EXISTS public.sms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sms_log_id UUID REFERENCES public.sms_logs(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'failed', 'undelivered', 'queued')),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs for SMS Operations
CREATE TABLE IF NOT EXISTS public.sms_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.sms_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_tracking ON public.sms_logs(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_logs_user ON public.sms_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON public.sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_category ON public.sms_logs(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON public.sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON public.sms_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sms_events_message ON public.sms_events(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_log ON public.sms_events(sms_log_id);

-- Disable Row Level Security for admin operations
ALTER TABLE public.sms_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_audit_logs DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for SMS logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_events;

-- Grant permissions
GRANT ALL ON public.sms_logs TO postgres;
GRANT ALL ON public.sms_logs TO service_role;
GRANT ALL ON public.sms_templates TO postgres;
GRANT ALL ON public.sms_templates TO service_role;
GRANT ALL ON public.sms_schedules TO postgres;
GRANT ALL ON public.sms_schedules TO service_role;
GRANT ALL ON public.sms_events TO postgres;
GRANT ALL ON public.sms_events TO service_role;
GRANT ALL ON public.sms_audit_logs TO postgres;
GRANT ALL ON public.sms_audit_logs TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_sms_logs_updated_at ON public.sms_logs;
CREATE TRIGGER update_sms_logs_updated_at
  BEFORE UPDATE ON public.sms_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON public.sms_templates;
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_schedules_updated_at ON public.sms_schedules;
CREATE TRIGGER update_sms_schedules_updated_at
  BEFORE UPDATE ON public.sms_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SMS templates
INSERT INTO public.sms_templates (template_id, name, category, message, is_system) VALUES
  ('shipment_created', 'Shipment Created', 'shipment', '📦 AirPak: Your shipment {tracking_number} has been created! Track at {track_url}', true),
  ('shipment_picked_up', 'Package Picked Up', 'shipment', '📦 AirPak: Your package {tracking_number} has been picked up. ETA: {eta}', true),
  ('shipment_in_transit', 'In Transit Update', 'shipment', '🚚 AirPak: Your package {tracking_number} is on the way!', true),
  ('shipment_out_for_delivery', 'Out for Delivery', 'shipment', '🚚 AirPak: Great news! Your package {tracking_number} is out for delivery today!', true),
  ('shipment_delivered', 'Delivered', 'shipment', '✅ AirPak: Your package {tracking_number} has been delivered!', true),
  ('shipment_exception', 'Delivery Exception', 'shipment', '⚠️ AirPak: Issue with your shipment {tracking_number}. Action required.', true),
  ('otp_code', 'OTP Verification', 'security', '🔐 AirPak: Your verification code is {code}. Do not share!', true),
  ('password_reset', 'Password Reset', 'security', '🔒 AirPak: Reset your password: {reset_url}', true),
  ('welcome', 'Welcome SMS', 'onboarding', '👋 Welcome to AirPak Express, {name}!', true),
  ('delivery_reminder', 'Delivery Reminder', 'notification', '📦 AirPak: Reminder - Your package {tracking_number} arrives {eta}.', true),
  ('payment_received', 'Payment Received', 'invoice', '💳 AirPak: Payment of {amount} received. Thank you!', true)
ON CONFLICT (template_id) DO NOTHING;

-- Comment on tables
COMMENT ON TABLE public.sms_logs IS 'Tracks all outgoing SMS messages with delivery status';
COMMENT ON TABLE public.sms_templates IS 'Stored SMS templates with variable placeholders';
COMMENT ON TABLE public.sms_schedules IS 'Scheduled and automated SMS sending rules';
COMMENT ON TABLE public.sms_events IS 'SMS delivery status events from Twilio';
COMMENT ON TABLE public.sms_audit_logs IS 'Audit trail for SMS system administrative actions';

-- RPC function to increment SMS counter
CREATE OR REPLACE FUNCTION public.increment_sms_counter(
  p_message_id TEXT,
  p_field TEXT
) RETURNS void AS $$
BEGIN
  IF p_field = 'delivered_count' THEN
    UPDATE public.sms_logs SET delivered_at = now(), status = 'delivered' WHERE message_id = p_message_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
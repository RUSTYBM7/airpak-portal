-- AirPak Express Email System Database Schema
-- Real-time email tracking and automation

-- Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE,
  tracking_number TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  template_id TEXT,
  template_type TEXT,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  provider TEXT DEFAULT 'zoho',
  provider_message_id TEXT,
  smtp_response TEXT,
  opens_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON public.email_logs(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_category ON public.email_logs(category);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active) WHERE is_active = true;

-- Email Schedules Table (for scheduled/recurring emails)
CREATE TABLE IF NOT EXISTS public.email_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('immediate', 'scheduled', 'recurring', 'event')),
  event_type TEXT,
  delay_hours INT DEFAULT 0,
  cron_expression TEXT,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for email_schedules
CREATE INDEX IF NOT EXISTS idx_email_schedules_active ON public.email_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_schedules_next ON public.email_schedules(next_trigger_at) WHERE next_trigger_at IS NOT NULL AND is_active = true;

-- Email Events Table (for tracking opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id UUID REFERENCES public.email_logs(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'bounce', 'complaint', 'open', 'click', 'unsubscribe')),
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for email_events
CREATE INDEX IF NOT EXISTS idx_email_events_message ON public.email_events(message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_log ON public.email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type);

-- Audit Logs for Email Operations
CREATE TABLE IF NOT EXISTS public.email_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for email_audit_logs
CREATE INDEX IF NOT EXISTS idx_email_audit_entity ON public.email_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_email_audit_user ON public.email_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_audit_created ON public.email_audit_logs(created_at DESC);

-- Disable Row Level Security for admin operations
ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_audit_logs DISABLE ROW LEVEL SECURITY;

-- Enable Realtime for email_logs and email_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events;

-- Grant permissions
GRANT ALL ON public.email_logs TO postgres;
GRANT ALL ON public.email_logs TO service_role;
GRANT ALL ON public.email_templates TO postgres;
GRANT ALL ON public.email_templates TO service_role;
GRANT ALL ON public.email_schedules TO postgres;
GRANT ALL ON public.email_schedules TO service_role;
GRANT ALL ON public.email_events TO postgres;
GRANT ALL ON public.email_events TO service_role;
GRANT ALL ON public.email_audit_logs TO postgres;
GRANT ALL ON public.email_audit_logs TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_email_schedules_updated_at
  BEFORE UPDATE ON public.email_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (template_id, name, description, category, subject_template, body_html_template, is_system) VALUES
  ('shipment_created', 'Shipment Created', 'Notification when a new shipment is created', 'shipment',
   'Your AirPak Express Shipment is Ready - {{tracking_number}}',
   '<h1>Shipment Created</h1><p>Your shipment {{tracking_number}} has been created.</p>', true),
  ('shipment_in_transit', 'In Transit Update', 'Notification when shipment is in transit', 'shipment',
   'Your Package is On the Way - {{tracking_number}}',
   '<h1>In Transit</h1><p>Your shipment {{tracking_number}} is now in transit.</p>', true),
  ('shipment_delivered', 'Delivery Confirmation', 'Notification when shipment is delivered', 'shipment',
   '✓ Delivered! Your AirPak Package Has Arrived - {{tracking_number}}',
   '<h1>Delivered</h1><p>Your shipment {{tracking_number}} has been delivered.</p>', true),
  ('shipment_exception', 'Delivery Exception', 'Notification for delivery issues', 'shipment',
   '⚠️ Action Required - Delivery Issue with {{tracking_number}}',
   '<h1>Delivery Exception</h1><p>There is an issue with your shipment {{tracking_number}}.</p>', true),
  ('welcome', 'Welcome Email', 'Welcome message for new users', 'onboarding',
   'Welcome to AirPak Express, {{name}}!',
   '<h1>Welcome!</h1><p>Hello {{name}}, welcome to AirPak Express.</p>', true),
  ('invoice_generated', 'Invoice Generated', 'Notification when invoice is ready', 'invoice',
   'New Invoice from AirPak Express - #{{invoice_number}}',
   '<h1>Invoice Generated</h1><p>Your invoice #{{invoice_number}} for {{amount}} is ready.</p>', true),
  ('password_reset', 'Password Reset', 'Password reset request email', 'security',
   'Reset Your AirPak Express Password',
   '<h1>Password Reset</h1><p>Click the link to reset your password.</p>', true),
  ('two_factor_code', '2FA Verification', 'Two-factor authentication code', 'security',
   'Your AirPak Express Verification Code',
   '<h1>Verification Code</h1><p>Your code is: {{code}}</p>', true)
ON CONFLICT (template_id) DO NOTHING;

-- Comment on tables
COMMENT ON TABLE public.email_logs IS 'Tracks all outgoing emails with delivery status';
COMMENT ON TABLE public.email_templates IS 'Stored email templates with variable placeholders';
COMMENT ON TABLE public.email_schedules IS 'Scheduled and automated email sending rules';
COMMENT ON TABLE public.email_events IS 'Individual email events (opens, clicks, bounces)';
COMMENT ON TABLE public.email_audit_logs IS 'Audit trail for email system administrative actions';

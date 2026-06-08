/**
 * AirPak Express - Real-time Email Service
 * Supabase Realtime integration for live email monitoring
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types
export interface EmailLog {
  id: string;
  message_id: string | null;
  tracking_number: string | null;
  user_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_id: string | null;
  template_type: string | null;
  category: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  provider: string | null;
  provider_message_id: string | null;
  opens_count: number;
  clicks_count: number;
  metadata: Record<string, any>;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  category: string;
  subject_template: string;
  body_html_template: string;
  body_text_template: string | null;
  variables: string[];
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailEvent {
  id: string;
  email_log_id: string | null;
  message_id: string;
  event_type: 'sent' | 'delivered' | 'bounce' | 'complaint' | 'open' | 'click' | 'unsubscribe';
  event_data: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

// Realtime callback types
type EmailCallback = (email: EmailLog) => void;
type EventCallback = (event: EmailEvent) => void;
type StatsCallback = (stats: EmailStats) => void;

// Realtime Email Service
class RealtimeEmailService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private emailCallbacks: Map<string, EmailCallback[]> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private statsCallbacks: StatsCallback[] = [];
  private emailLogs: EmailLog[] = [];
  private emailEvents: EmailEvent[] = [];
  private subscriptionCounter = 0;

  /**
   * Subscribe to all email log changes
   * @returns subscription key for unsubscribing
   */
  subscribeToEmailLogs(
    filter?: { status?: string; category?: string; user_id?: string },
    callback?: EmailCallback
  ): string {
    const subscriptionKey = `email_logs_${++this.subscriptionCounter}`;
    const channelName = `email_logs_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_logs',
          filter: filter
            ? Object.entries(filter)
                .filter(([_, v]) => v)
                .map(([k, v]) => `${k}=eq.${v}`)
                .join(',')
            : undefined
        },
        (payload) => {
          const email = payload.new as EmailLog;

          // Update local state
          if (payload.eventType === 'INSERT') {
            this.emailLogs.unshift(email);
          } else if (payload.eventType === 'UPDATE') {
            const index = this.emailLogs.findIndex(e => e.id === email.id);
            if (index !== -1) {
              this.emailLogs[index] = email;
            }
          } else if (payload.eventType === 'DELETE') {
            this.emailLogs = this.emailLogs.filter(e => e.id !== (payload.old as EmailLog).id);
          }

          // Notify callbacks
          this.emailCallbacks.get(subscriptionKey)?.forEach(cb => cb(email));
        }
      )
      .subscribe();

    this.channels.set(subscriptionKey, channel);
    if (callback) {
      const callbacks = this.emailCallbacks.get(subscriptionKey) || [];
      callbacks.push(callback);
      this.emailCallbacks.set(subscriptionKey, callbacks);
    }

    return subscriptionKey;
  }

  /**
   * Subscribe to email events (opens, clicks, etc.)
   * @returns subscription key for unsubscribing
   */
  subscribeToEmailEvents(
    messageId?: string,
    callback?: EventCallback
  ): string {
    const subscriptionKey = `email_events_${++this.subscriptionCounter}`;
    const channelName = `email_events_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'email_events',
          filter: messageId ? `message_id=eq.${messageId}` : undefined
        },
        (payload) => {
          const event = payload.new as EmailEvent;
          this.emailEvents.unshift(event);
          this.eventCallbacks.get(subscriptionKey)?.forEach(cb => cb(event));
        }
      )
      .subscribe();

    this.channels.set(subscriptionKey, channel);
    if (callback) {
      const callbacks = this.eventCallbacks.get(subscriptionKey) || [];
      callbacks.push(callback);
      this.eventCallbacks.set(subscriptionKey, callbacks);
    }

    return subscriptionKey;
  }

  /**
   * Subscribe to email statistics updates
   */
  subscribeToStats(callback: StatsCallback): () => void {
    this.statsCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.statsCallbacks = this.statsCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Fetch email logs with pagination
   */
  async fetchEmailLogs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: EmailLog[]; count: number }> {
    const { page = 1, limit = 20, status, category, search, startDate, endDate } = params || {};

    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('recipient_email', `%${search}%`);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error, count } = await query;

    if (error) throw error;

    return { data: data || [], count: count || 0 };
  }

  /**
   * Fetch email templates
   */
  async fetchEmailTemplates(category?: string): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  /**
   * Send an email
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    trackingNumber?: string;
    userId?: string;
    templateId?: string;
    templateType?: string;
    category?: string;
    scheduledAt?: string;
    metadata?: Record<string, any>;
  }): Promise<EmailLog> {
    const { data: log, error: insertError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: params.to,
        subject: params.subject,
        template_id: params.templateId,
        template_type: params.templateType,
        category: params.category || 'general',
        tracking_number: params.trackingNumber,
        user_id: params.userId,
        status: 'pending',
        metadata: params.metadata || {},
        scheduled_at: params.scheduledAt
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Call edge function to send email
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-email', {
        body: {
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
          messageId: log.message_id
        }
      });

      if (edgeError) throw edgeError;

      // Update log with sent status
      const { data: updatedLog, error: updateError } = await supabase
        .from('email_logs')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: edgeData?.messageId
        })
        .eq('id', log.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updatedLog;
    } catch (err) {
      // Update log with failed status
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          smtp_response: err instanceof Error ? err.message : 'Unknown error'
        })
        .eq('id', log.id);

      throw err;
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplatedEmail(params: {
    to: string;
    templateId: string;
    variables: Record<string, string>;
    trackingNumber?: string;
    userId?: string;
    scheduledAt?: string;
    metadata?: Record<string, any>;
  }): Promise<EmailLog> {
    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_id', params.templateId)
      .eq('is_active', true)
      .single();

    if (templateError) throw templateError;
    if (!template) throw new Error(`Template ${params.templateId} not found`);

    // Replace variables in subject and body
    let subject = template.subject_template;
    let htmlBody = template.body_html_template;
    let textBody = template.body_text_template;

    for (const [key, value] of Object.entries(params.variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), value);
      if (textBody) textBody = textBody.replace(new RegExp(placeholder, 'g'), value);
    }

    return this.sendEmail({
      to: params.to,
      subject,
      html: htmlBody,
      text: textBody,
      templateId: template.template_id,
      templateType: template.category,
      trackingNumber: params.trackingNumber,
      userId: params.userId,
      scheduledAt: params.scheduledAt,
      metadata: params.metadata
    });
  }

  /**
   * Get email statistics
   */
  async getEmailStats(params?: { startDate?: string; endDate?: string }): Promise<EmailStats> {
    let query = supabase
      .from('email_logs')
      .select('status', { count: 'exact' });

    if (params?.startDate) query = query.gte('created_at', params.startDate);
    if (params?.endDate) query = query.lte('created_at', params.endDate);

    const { data, error } = await query;

    if (error) throw error;

    const logs = (data || []) as EmailLog[];
    const totalSent = logs.length;
    const totalDelivered = logs.filter(l => ['delivered', 'opened', 'clicked'].includes(l.status)).length;
    const totalFailed = logs.filter(l => ['failed', 'bounced'].includes(l.status)).length;
    const totalOpened = logs.filter(l => (l.opens_count || 0) > 0).length;
    const totalClicked = logs.filter(l => (l.clicks_count || 0) > 0).length;

    return {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_failed: totalFailed,
      delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
      click_rate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0
    };
  }

  /**
   * Track email open/click
   */
  async trackEmailEvent(params: {
    messageId: string;
    eventType: 'open' | 'click';
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    // Insert event
    const { error } = await supabase
      .from('email_events')
      .insert({
        message_id: params.messageId,
        event_type: params.eventType,
        ip_address: params.ipAddress,
        user_agent: params.userAgent
      });

    if (error) console.error('Failed to track email event:', error);

    // Update email log counters
    const updateField = params.eventType === 'open' ? 'opens_count' : 'clicks_count';
    await supabase.rpc('increment_email_counter', {
      p_message_id: params.messageId,
      p_field: updateField
    });
  }

  /**
   * Get email by message ID
   */
  async getEmailByMessageId(messageId: string): Promise<EmailLog | null> {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('message_id', messageId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get local email logs cache
   */
  getLocalEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }

  /**
   * Get local email events cache
   */
  getLocalEmailEvents(): EmailEvent[] {
    return this.emailEvents;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.emailCallbacks.delete(channelName);
      this.eventCallbacks.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.emailCallbacks.clear();
    this.eventCallbacks.clear();
    this.statsCallbacks = [];
    this.emailLogs = [];
    this.emailEvents = [];
  }
}

// Export singleton instance
export const realtimeEmail = new RealtimeEmailService();
export default realtimeEmail;

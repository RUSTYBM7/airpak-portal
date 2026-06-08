/**
 * AirPak Express - Email Service Integration
 * Connects frontend to Supabase Edge Functions for sending emails
 */

import { supabase } from './supabase';

// Email sending service using Supabase Edge Functions
export class EmailSenderService {
  private edgeFunctionUrl: string;

  constructor() {
    // Use absolute URL for production
    this.edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL || 'https://zygoqqsgzhgpvlpttfbk.supabase.co'}/functions/v1/send-account-verification`;
  }

  /**
   * Send account verification email
   * @param email - User's email address
   * @param name - User's name
   * @param codeType - 'verification' | 'welcome' | 'password_reset'
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    codeType: 'verification' | 'welcome' | 'password_reset' = 'verification',
    phone?: string
  ): Promise<{ success: boolean; message: string; verification_code?: string; sms_sent?: boolean; email_sent?: boolean }> {
    try {
      // Call the Supabase Edge Function
      const response = await fetch(this.edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          phone: phone,
          name: name || 'User',
          codeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification');
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Verification code sent',
        verification_code: result.verification_code,
        sms_sent: result.sms_sent,
        email_sent: result.email_sent,
      };
    } catch (error: any) {
      console.error('Email sending error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send verification email',
      };
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; message: string }> {
    return this.sendVerificationEmail(email, name, 'welcome');
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string): Promise<{ success: boolean; message: string }> {
    return this.sendVerificationEmail(email, name, 'password_reset');
  }

  /**
   * Check if user has verified their email
   */
  async checkEmailVerification(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('two_factor_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code_type', 'verification')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return false;
      }

      const latestCode = data[0];
      const expiresAt = new Date(latestCode.expires_at);
      const now = new Date();

      // Code is valid if it hasn't expired
      return expiresAt > now && latestCode.verified;
    } catch (error) {
      console.error('Verification check error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailSender = new EmailSenderService();

// Convenience functions
export const sendVerificationEmail = async (email: string, name: string, phone?: string) => {
  return emailSender.sendVerificationEmail(email, name, 'verification', phone);
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  return emailSender.sendWelcomeEmail(email, name);
};

export const sendPasswordResetEmail = async (email: string, name: string) => {
  return emailSender.sendPasswordResetEmail(email, name);
};

export default emailSender;
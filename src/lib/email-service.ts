/**
 * AirPak Express - Email Automation Service
 * Zoho Mail SMTP Integration
 */

import { BrandColors, AirPakLogo } from './brand-engine';

// Zoho SMTP Configuration
export const ZOHO_SMTP = {
  host: 'smtppro.zoho.com',
  port: 465, // SSL
  secure: true,
  auth: {
    user: 'Admin@airpak-express.site',
    // Password will be set by admin
    pass: ''
  }
};

// Email Types
export type EmailType =
  | 'shipment_created'
  | 'shipment_picked_up'
  | 'shipment_in_transit'
  | 'shipment_customs'
  | 'shipment_out_for_delivery'
  | 'shipment_delivered'
  | 'shipment_exception'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'welcome'
  | 'password_reset'
  | 'document_generated'
  | 'notification';

// Email Interface
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

// Email Template Data
export interface EmailTemplateData {
  recipientName?: string;
  trackingNumber?: string;
  status?: string;
  destination?: string;
  origin?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  invoiceAmount?: string;
  dueDate?: string;
  documentType?: string;
  documentUrl?: string;
  resetLink?: string;
  supportUrl?: string;
  [key: string]: string | undefined;
}

// Generate Email HTML with Brand Header
const generateBrandedEmail = (content: string): string => {
  const logoSvg = AirPakLogo;
  const logoDataUrl = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AirPak Express</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Email Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BrandColors.secondary} 0%, #1e293b 100%); padding: 30px; text-align: center;">
              <img src="${logoDataUrl}" alt="AirPak Express" style="height: 50px; margin-bottom: 10px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; letter-spacing: 2px;">GLOBAL LOGISTICS SOLUTIONS</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                      Need help? Contact us at <a href="mailto:support@airpak-express.site" style="color: ${BrandColors.primary};">support@airpak-express.site</a>
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © 2026 AirPak Express. All rights reserved.<br>
                      123 Logistics Way, New York, NY 10001
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

// Email Templates
export const EmailTemplates = {
  shipment_created: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: `Shipment Created - ${data.trackingNumber}`,
    html: generateBrandedEmail(`
      <h1 style="color: ${BrandColors.secondary}; margin: 0 0 20px; font-size: 24px;">Shipment Created Successfully!</h1>
      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'Valued Customer'},</p>
      <p style="color: #374151; line-height: 1.6;">Your shipment has been created and is ready for pickup.</p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h2 style="color: ${BrandColors.primary}; margin: 0 0 15px; font-size: 18px;">Shipment Details</h2>
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Tracking Number:</td>
            <td style="color: ${BrandColors.secondary}; font-weight: bold; text-align: right;">${data.trackingNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0;">From:</td>
            <td style="color: #374151; text-align: right;">${data.origin}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0;">To:</td>
            <td style="color: #374151; text-align: right;">${data.destination}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Est. Delivery:</td>
            <td style="color: #374151; text-align: right;">${data.estimatedDelivery}</td>
          </tr>
        </table>
      </div>

      <a href="${data.trackingUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">Track Your Shipment</a>
    `)
  }),

  shipment_status: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: `Shipment Update - ${data.trackingNumber} is ${data.status}`,
    html: generateBrandedEmail(`
      <h1 style="color: ${BrandColors.secondary}; margin: 0 0 20px; font-size: 24px;">Shipment Status Update</h1>
      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'Valued Customer'},</p>
      <p style="color: #374151; line-height: 1.6;">Your shipment status has been updated.</p>

      <div style="background-color: #fef3c7; border-left: 4px solid ${BrandColors.accent}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h2 style="color: ${BrandColors.secondary}; margin: 0 0 10px; font-size: 18px;">Current Status: ${data.status}</h2>
        <p style="color: #64748b; margin: 0;">${data.statusMessage || 'Your package is on its way!'}</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #64748b; margin: 0 0 5px;">Tracking Number:</p>
        <p style="color: ${BrandColors.secondary}; font-weight: bold; font-size: 18px; margin: 0;">${data.trackingNumber}</p>
      </div>

      <a href="${data.trackingUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">View Full Tracking</a>
    `)
  }),

  shipment_delivered: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: `Delivered! - ${data.trackingNumber}`,
    html: generateBrandedEmail(`
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 style="color: #10b981; margin: 0 0 10px; font-size: 28px;">Delivered!</h1>
        <p style="color: #64748b; margin: 0;">Your package has been successfully delivered</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h2 style="color: ${BrandColors.secondary}; margin: 0 0 15px; font-size: 18px;">Delivery Details</h2>
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Tracking Number:</td>
            <td style="color: ${BrandColors.secondary}; font-weight: bold; text-align: right;">${data.trackingNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Delivered To:</td>
            <td style="color: #374151; text-align: right;">${data.destination}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Delivered At:</td>
            <td style="color: #374151; text-align: right;">${data.deliveredAt || new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <p style="color: #374151; line-height: 1.6;">Thank you for choosing AirPak Express! We hope to serve you again soon.</p>
    `)
  }),

  invoice_sent: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: `Invoice ${data.invoiceNumber} - Due ${data.dueDate}`,
    html: generateBrandedEmail(`
      <h1 style="color: ${BrandColors.secondary}; margin: 0 0 20px; font-size: 24px;">Invoice Ready</h1>
      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'Valued Customer'},</p>
      <p style="color: #374151; line-height: 1.6;">Please find attached invoice ${data.invoiceNumber}.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid ${BrandColors.primary}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #64748b; margin: 0 0 5px;">Amount Due:</p>
        <p style="color: ${BrandColors.primary}; font-size: 32px; font-weight: bold; margin: 0;">${data.invoiceAmount || '$0.00'}</p>
        <p style="color: #64748b; margin: 10px 0 0; font-size: 14px;">Due Date: ${data.dueDate}</p>
      </div>

      <a href="${data.invoiceUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 0;">View Invoice</a>
    `)
  }),

  password_reset: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: 'Reset Your AirPak Express Password',
    html: generateBrandedEmail(`
      <h1 style="color: ${BrandColors.secondary}; margin: 0 0 20px; font-size: 24px;">Password Reset Request</h1>
      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'User'},</p>
      <p style="color: #374151; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
      </div>

      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> This link expires in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="color: ${BrandColors.primary}; font-size: 12px; word-break: break-all;">${data.resetLink}</p>
    `)
  }),

  welcome: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: 'Welcome to AirPak Express!',
    html: generateBrandedEmail(`
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: ${BrandColors.primary}; margin: 0 0 10px; font-size: 32px;">Welcome aboard!</h1>
        <p style="color: #64748b; margin: 0;">Your AirPak Express account is ready</p>
      </div>

      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'New User'},</p>
      <p style="color: #374151; line-height: 1.6;">Thank you for joining AirPak Express! You now have access to:</p>

      <ul style="color: #374151; line-height: 2;">
        <li>Real-time shipment tracking to 220+ countries</li>
        <li>AI-powered document generation</li>
        <li>Instant notifications and updates</li>
        <li>Secure payment processing</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
      </div>

      <p style="color: #64748b; font-size: 14px; text-align: center;">Need help? Contact our support team anytime.</p>
    `)
  }),

  document_generated: (data: EmailTemplateData): EmailPayload => ({
    to: data.recipientEmail || '',
    subject: `Document Ready - ${data.documentType}`,
    html: generateBrandedEmail(`
      <h1 style="color: ${BrandColors.secondary}; margin: 0 0 20px; font-size: 24px;">Document Generated</h1>
      <p style="color: #374151; line-height: 1.6;">Dear ${data.recipientName || 'Valued Customer'},</p>
      <p style="color: #374151; line-height: 1.6;">Your ${data.documentType || 'document'} has been generated and is ready for download.</p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Document Type:</td>
            <td style="color: ${BrandColors.secondary}; font-weight: bold; text-align: right;">${data.documentType}</td>
          </tr>
          ${data.trackingNumber ? `
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Related Shipment:</td>
            <td style="color: #374151; text-align: right;">${data.trackingNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="color: #64748b; padding: 5px 0;">Generated At:</td>
            <td style="color: #374151; text-align: right;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.documentUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px;">Download PDF</a>
        ${data.documentUrl ? `
        <a href="${data.documentUrl}" style="display: inline-block; background-color: #64748b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px;">View Online</a>
        ` : ''}
      </div>
    `)
  })
};

// Email Service Class
export class EmailService {
  private smtpConfig: typeof ZOHO_SMTP;
  private emailQueue: EmailPayload[] = [];
  private isProcessing: boolean = false;

  constructor(smtpConfig?: Partial<typeof ZOHO_SMTP>) {
    this.smtpConfig = { ...ZOHO_SMTP, ...smtpConfig };
  }

  // Set SMTP password (for admin configuration)
  setPassword(password: string): void {
    this.smtpConfig.auth.pass = password;
  }

  // Generate email from template
  generateEmail(type: EmailType, data: EmailTemplateData & { recipientEmail: string }): EmailPayload {
    const template = EmailTemplates[type];
    if (!template) {
      throw new Error(`Email template "${type}" not found`);
    }
    return template(data);
  }

  // Queue email for sending
  async queueEmail(email: EmailPayload): Promise<void> {
    this.emailQueue.push(email);
    this.processQueue();
  }

  // Process email queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.emailQueue.length === 0) return;

    this.isProcessing = true;

    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift();
      if (email) {
        try {
          await this.sendEmail(email);
        } catch (error) {
          console.error('Failed to send email:', error);
          // Re-queue failed emails
          this.emailQueue.unshift(email);
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  // Send email via API (to be implemented with backend)
  async sendEmail(email: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate configuration
    if (!this.smtpConfig.auth.pass) {
      console.warn('Email password not configured. Email logged to console.');
      console.log('Email would be sent:', {
        to: email.to,
        subject: email.subject
      });
      return { success: false, error: 'SMTP password not configured' };
    }

    try {
      // In production, this would call a backend API to send via Zoho SMTP
      // For now, we'll simulate the send
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...email,
          smtp: {
            host: this.smtpConfig.host,
            port: this.smtpConfig.port,
            secure: this.smtpConfig.secure,
            auth: {
              user: this.smtpConfig.auth.user
              // Password should be handled server-side
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Send immediate email (bypasses queue)
  async sendImmediate(email: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.smtpConfig.auth.pass) {
      console.log('Email (mock):', {
        to: email.to,
        subject: email.subject,
        preview: email.html.substring(0, 200)
      });
      return { success: true, messageId: `mock-${Date.now()}` };
    }
    return this.sendEmail(email);
  }

  // Batch send
  async sendBatch(emails: EmailPayload[]): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const email of emails) {
      const result = await this.sendImmediate(email);
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${email.to}: ${result.error}`);
      }
    }

    return results;
  }
}

// Default email service instance
export const emailService = new EmailService();

// Convenience functions
export const sendShipmentCreatedEmail = async (data: EmailTemplateData) => {
  const email = emailService.generateEmail('shipment_created', {
    ...data,
    recipientEmail: data.recipientEmail || ''
  });
  return emailService.sendImmediate(email);
};

export const sendShipmentStatusEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('shipment_delivered', data);
  return emailService.sendImmediate(email);
};

export const sendShipmentDeliveredEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('shipment_delivered', data);
  return emailService.sendImmediate(email);
};

export const sendInvoiceEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('invoice_sent', data);
  return emailService.sendImmediate(email);
};

export const sendPasswordResetEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('password_reset', data);
  return emailService.sendImmediate(email);
};

export const sendWelcomeEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('welcome', data);
  return emailService.sendImmediate(email);
};

export const sendDocumentGeneratedEmail = async (data: EmailTemplateData & { recipientEmail: string }) => {
  const email = emailService.generateEmail('document_generated', data);
  return emailService.sendImmediate(email);
};

export default EmailService;

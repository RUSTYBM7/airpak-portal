/**
 * AirPak Express - Additional Email Templates
 * Additional email templates for shipment, invoice, etc.
 */

// Email template data interface
export interface EmailTemplateData {
  recipientName?: string;
  recipientEmail?: string;
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
  trackingUrl?: string;
  dashboardUrl?: string;
  [key: string]: string | undefined;
}

// Brand colors
const BrandColors = {
  primary: '#dc143c',
  secondary: '#0f172a',
  accent: '#f59e0b',
  white: '#ffffff',
  gray: '#64748b',
};

// Generate branded email header/footer
const generateEmailFrame = (content: string, title?: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'AirPak Express'}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a;">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BrandColors.primary} 0%, #b01030 100%); padding: 32px 40px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.15); border-radius: 12px; padding: 12px 24px;">
                <span style="font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">AirPak</span>
                <span style="font-size: 12px; color: rgba(255,255,255,0.8); margin-left: 8px; text-transform: uppercase; letter-spacing: 2px;">Express</span>
              </div>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 12px 0 0; letter-spacing: 1px;">Global Logistics Solutions</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 40px; background-color: #1e293b;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; border-top: 1px solid #334155;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                      Need help? Contact us at <a href="mailto:support@airpak-express.site" style="color: ${BrandColors.primary}; text-decoration: none;">support@airpak-express.site</a>
                    </p>
                    <p style="color: #475569; font-size: 12px; margin: 0;">
                      © 2026 AirPak Express. All rights reserved.<br>
                      ShipNow Portal • Global Logistics Solutions
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

// Shipment Created Email
export const shipmentCreatedEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const content = `
    <h1 style="color: ${BrandColors.white}; margin: 0 0 20px; font-size: 24px; text-align: center;">Shipment Created Successfully!</h1>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'Valued Customer'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">Your shipment has been created and is ready for pickup.</p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="color: ${BrandColors.primary}; margin: 0 0 16px; font-size: 18px;">Shipment Details</h2>
      <table style="width: 100%; color: #e2e8f0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Tracking Number:</td>
          <td style="text-align: right; font-weight: bold; color: ${BrandColors.primary};">${data.trackingNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">From:</td>
          <td style="text-align: right;">${data.origin || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">To:</td>
          <td style="text-align: right;">${data.destination || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Est. Delivery:</td>
          <td style="text-align: right;">${data.estimatedDelivery || 'N/A'}</td>
        </tr>
      </table>
    </div>

    ${data.trackingUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.trackingUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Your Shipment</a>
    </div>
    ` : ''}
  `;

  return {
    subject: `Shipment Created - ${data.trackingNumber}`,
    html: generateEmailFrame(content, `Shipment Created - ${data.trackingNumber}`)
  };
};

// Shipment Status Update Email
export const shipmentStatusEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const statusColors: Record<string, string> = {
    'picked_up': '#10b981',
    'in_transit': '#3b82f6',
    'customs': '#f59e0b',
    'out_for_delivery': '#8b5cf6',
    'delivered': '#10b981',
    'exception': '#ef4444'
  };

  const content = `
    <h1 style="color: ${statusColors[data.status || 'in_transit'] || BrandColors.primary}; margin: 0 0 20px; font-size: 24px; text-align: center;">Shipment Status Update</h1>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'Valued Customer'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">Your shipment status has been updated.</p>

    <div style="background: linear-gradient(135deg, ${statusColors[data.status || 'in_transit'] || BrandColors.primary}20 0%, ${statusColors[data.status || 'in_transit'] || BrandColors.primary}05 100%); border-left: 4px solid ${statusColors[data.status || 'in_transit'] || BrandColors.primary}; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h2 style="color: ${statusColors[data.status || 'in_transit'] || BrandColors.primary}; margin: 0 0 8px; font-size: 20px; text-transform: capitalize;">Status: ${data.status?.replace('_', ' ') || 'In Transit'}</h2>
    </div>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #64748b; margin: 0 0 8px; font-size: 14px;">Tracking Number</p>
      <p style="color: ${BrandColors.primary}; font-weight: bold; font-size: 24px; margin: 0;">${data.trackingNumber || 'N/A'}</p>
    </div>

    ${data.trackingUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.trackingUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Full Tracking</a>
    </div>
    ` : ''}
  `;

  return {
    subject: `Shipment Update - ${data.trackingNumber} is ${data.status?.replace('_', ' ')}`,
    html: generateEmailFrame(content, `Shipment Update - ${data.trackingNumber}`)
  };
};

// Invoice Email
export const invoiceEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const content = `
    <h1 style="color: ${BrandColors.white}; margin: 0 0 20px; font-size: 24px; text-align: center;">Invoice Ready</h1>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'Valued Customer'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">Please find attached invoice ${data.invoiceNumber || 'N/A'}.</p>

    <div style="background: linear-gradient(135deg, ${BrandColors.primary}15 0%, ${BrandColors.primary}05 100%); border-left: 4px solid ${BrandColors.primary}; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #64748b; margin: 0 0 8px; font-size: 14px;">Amount Due</p>
      <p style="color: ${BrandColors.primary}; font-size: 36px; font-weight: bold; margin: 0;">${data.invoiceAmount || '$0.00'}</p>
      <p style="color: #64748b; margin: 12px 0 0; font-size: 14px;">Due Date: ${data.dueDate || 'N/A'}</p>
    </div>

    ${data.documentUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.documentUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Invoice</a>
    </div>
    ` : ''}
  `;

  return {
    subject: `Invoice ${data.invoiceNumber || 'N/A'} - Due ${data.dueDate || 'N/A'}`,
    html: generateEmailFrame(content, `Invoice ${data.invoiceNumber || 'N/A'}`)
  };
};

// Document Generated Email
export const documentGeneratedEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const content = `
    <h1 style="color: ${BrandColors.white}; margin: 0 0 20px; font-size: 24px; text-align: center;">Document Generated</h1>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'Valued Customer'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">Your ${data.documentType || 'document'} has been generated and is ready for download.</p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <table style="width: 100%; color: #e2e8f0;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Document Type:</td>
          <td style="text-align: right; font-weight: bold; color: ${BrandColors.primary};">${data.documentType || 'N/A'}</td>
        </tr>
        ${data.trackingNumber ? `
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Related Shipment:</td>
          <td style="text-align: right;">${data.trackingNumber}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Generated At:</td>
          <td style="text-align: right;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>

    ${data.documentUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.documentUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Download PDF</a>
    </div>
    ` : ''}
  `;

  return {
    subject: `Document Ready - ${data.documentType || 'Document'}`,
    html: generateEmailFrame(content, `Document Ready - ${data.documentType || 'Document'}`)
  };
};

// Welcome Email
export const welcomeEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; background-color: ${BrandColors.primary}20; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">🎉</span>
      </div>
      <h1 style="color: ${BrandColors.primary}; margin: 0 0 10px; font-size: 32px;">Welcome aboard!</h1>
      <p style="color: #64748b; margin: 0;">Your AirPak Express account is ready</p>
    </div>

    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'New User'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">Thank you for joining AirPak Express! You now have access to:</p>

    <ul style="color: #e2e8f0; line-height: 2; font-size: 16px; padding-left: 20px;">
      <li>Real-time shipment tracking to 220+ countries</li>
      <li>AI-powered document generation</li>
      <li>Instant notifications and updates</li>
      <li>Secure payment processing</li>
    </ul>

    ${data.dashboardUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
    </div>
    ` : ''}

    <p style="color: #64748b; font-size: 14px; text-align: center;">Need help? Contact our support team anytime.</p>
  `;

  return {
    subject: 'Welcome to AirPak Express!',
    html: generateEmailFrame(content, 'Welcome to AirPak Express!')
  };
};

// Password Reset Email
export const passwordResetEmail = (data: EmailTemplateData): { subject: string; html: string } => {
  const content = `
    <h1 style="color: ${BrandColors.white}; margin: 0 0 20px; font-size: 24px; text-align: center;">Password Reset Request</h1>
    <p style="color: #94a3b8; line-height: 1.6; font-size: 16px;">Dear ${data.recipientName || 'User'},</p>
    <p style="color: #94a3b8; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>

    ${data.resetLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetLink}" style="display: inline-block; background-color: ${BrandColors.primary}; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
    </div>
    ` : ''}

    <div style="background-color: #f59e0b20; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #f59e0b; margin: 0; font-size: 14px; font-weight: 600;">⚠️ Security Notice:</p>
      <p style="color: #64748b; margin: 8px 0 0; font-size: 13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
    </div>

    ${data.resetLink ? `
    <p style="color: #64748b; font-size: 12px; text-align: center; word-break: break-all;">Or copy this link: ${data.resetLink}</p>
    ` : ''}
  `;

  return {
    subject: 'Reset Your AirPak Express Password',
    html: generateEmailFrame(content, 'Reset Your Password')
  };
};

export default {
  shipmentCreatedEmail,
  shipmentStatusEmail,
  invoiceEmail,
  documentGeneratedEmail,
  welcomeEmail,
  passwordResetEmail
};
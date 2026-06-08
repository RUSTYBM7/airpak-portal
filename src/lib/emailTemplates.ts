/**
 * AirPak Express - Professional Branded Email Templates
 * Dark theme with red accent colors
 */

// Base template wrapper
const baseTemplate = (content: string, footer: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AirPak Express</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111111; color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
    .wrapper { max-width: 680px; margin: 0 auto; padding: 40px 20px; }
    .header { background: #000000; border-bottom: 1px solid #1f1f1f; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { width: 40px; height: 40px; background: #CC0000; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .brand-logo svg { width: 24px; height: 24px; }
    .brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .brand-name span { color: #CC0000; }
    .header-badge { background: rgba(204,0,0,0.15); color: #CC0000; font-size: 10px; font-weight: 600; padding: 4px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; }
    .content { background: #0a0a0a; padding: 48px 40px; border: 1px solid #1f1f1f; }
    .status-bar { background: #050505; padding: 12px 32px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #1f1f1f; font-size: 11px; font-family: 'SF Mono', 'Monaco', monospace; }
    .status-dot { width: 8px; height: 8px; background: #00c853; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .status-text { color: #00c853; font-weight: 600; }
    .footer { background: #0a0a0a; padding: 32px 40px; border: 1px solid #1f1f1f; border-top: none; }
    .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
    .footer-links a { color: #666; text-decoration: none; font-size: 12px; }
    .footer-links a:hover { color: #999; }
    .footer-legal { text-align: center; color: #444; font-size: 11px; line-height: 1.8; }
    .footer-legal p { margin-bottom: 4px; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #CC0000, transparent); margin: 32px 0; }
    @media (max-width: 600px) { .wrapper { padding: 0; } .header, .content, .footer { padding: 24px 20px; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12l5 5L20 7"/>
          </svg>
        </div>
        <span class="brand-name">Air<span>Pak</span></span>
      </div>
      <span class="header-badge">AirPak Express</span>
    </div>
    <div class="status-bar">
      <span class="status-dot"></span>
      <span class="status-text">Automated Message</span>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-links">
        <a href="#">Dashboard</a>
        <a href="#">Support</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
      </div>
      <div class="footer-legal">
        <p>© 2026 AirPak Express. All rights reserved.</p>
        <p>Heart Bridge Org | Spokane, WA</p>
        <p style="margin-top: 12px; color: #333;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Button style
const button = (href: string, text: string, primary: boolean = true) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
    <tr>
      <td align="center" style="border-radius: 8px; ${primary ? 'background: #CC0000;' : 'background: transparent; border: 1px solid #333;'}">
        <a href="${href}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; ${primary ? '' : 'color: #999;'}">${text}</a>
      </td>
    </tr>
  </table>
`;

// Info box
const infoBox = (title: string, value: string, icon: string = '') => `
  <div style="background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 8px; padding: 20px 24px; margin: 16px 0; display: flex; gap: 16px; align-items: center;">
    <div style="width: 40px; height: 40px; background: rgba(204,0,0,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
      <span style="font-size: 18px;">${icon}</span>
    </div>
    <div>
      <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${title}</p>
      <p style="color: #fff; font-size: 15px; font-weight: 600;">${value}</p>
    </div>
  </div>
`;

// Timeline item
const timelineItem = (date: string, time: string, location: string, status: string, isLast: boolean = false) => `
  <div style="display: flex; gap: 16px; padding-bottom: ${isLast ? '0' : '24px'}; position: relative;">
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="width: 12px; height: 12px; background: ${status === 'completed' ? '#00c853' : status === 'current' ? '#CC0000' : '#333'}; border-radius: 50%;"></div>
      ${!isLast ? '<div style="width: 2px; flex: 1; background: #1f1f1f; margin-top: 4px;"></div>' : ''}
    </div>
    <div style="flex: 1; padding-bottom: 8px;">
      <p style="color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${status === 'current' ? '📍 ' : ''}${location}</p>
      <p style="color: #666; font-size: 12px;">${date} at ${time}</p>
    </div>
  </div>
`;

// Export all templates
export const EmailTemplates = {
  /**
   * Shipment Created - New shipment confirmation
   */
  shipmentCreated: (data: {
    trackingNumber: string;
    origin: string;
    destination: string;
    estimatedDelivery: string;
    carrier: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(204,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Shipment Created</h1>
      <p style="color: #888; font-size: 15px;">Your shipment is now being processed and will be picked up soon.</p>
    </div>

    ${infoBox('Tracking Number', data.trackingNumber, '📦')}

    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; margin: 24px 0; align-items: center;">
      <div style="text-align: center; padding: 20px; background: #0d0d0d; border-radius: 8px;">
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">From</p>
        <p style="color: #fff; font-weight: 600;">${data.origin}</p>
      </div>
      <div style="color: #CC0000; font-size: 24px;">→</div>
      <div style="text-align: center; padding: 20px; background: #0d0d0d; border-radius: 8px;">
        <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">To</p>
        <p style="color: #fff; font-weight: 600;">${data.destination}</p>
      </div>
    </div>

    ${infoBox('Estimated Delivery', data.estimatedDelivery, '📅')}
    ${infoBox('Carrier', data.carrier, '🚚')}

    ${button('https://shipnow.airpak-express.site/track?num=' + data.trackingNumber, 'Track Your Shipment')}
  `),

  /**
   * Shipment In Transit - Package on the move
   */
  shipmentInTransit: (data: {
    trackingNumber: string;
    location: string;
    lastUpdate: string;
    eta: string;
    events: Array<{ date: string; time: string; location: string; status: string }>;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(0,200,83,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">In Transit</h1>
      <p style="color: #888; font-size: 15px;">Your package is on its way to the destination.</p>
    </div>

    ${infoBox('Tracking Number', data.trackingNumber, '📦')}
    ${infoBox('Current Location', data.location, '📍')}
    ${infoBox('Last Update', data.lastUpdate, '🕐')}
    ${infoBox('Estimated Arrival', data.eta, '📅')}

    <div style="margin: 32px 0;">
      <h3 style="font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Tracking History</h3>
      ${data.events.map((event, i) => timelineItem(event.date, event.time, event.location, event.status, i === data.events.length - 1)).join('')}
    </div>

    ${button('https://shipnow.airpak-express.site/track?num=' + data.trackingNumber, 'View Full Tracking')}
  `),

  /**
   * Shipment Delivered - Delivery confirmation
   */
  shipmentDelivered: (data: {
    trackingNumber: string;
    deliveredAt: string;
    signedBy: string;
    location: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(0,200,83,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Delivered</h1>
      <p style="color: #00c853; font-size: 15px; font-weight: 600;">Your package has been delivered successfully!</p>
    </div>

    ${infoBox('Tracking Number', data.trackingNumber, '📦')}
    ${infoBox('Delivered At', data.deliveredAt, '✓')}
    ${infoBox('Signed By', data.signedBy, '✍️')}
    ${infoBox('Delivery Location', data.location, '📍')}

    <div style="background: #0d0d0d; border-left: 3px solid #00c853; padding: 20px 24px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #888; font-size: 13px; line-height: 1.7;">
        Thank you for choosing AirPak Express for your shipping needs. We hope you had a great experience!
        If you have any questions or feedback, please don't hesitate to reach out to our support team.
      </p>
    </div>

    ${button('https://shipnow.airpak-express.site', 'Send Feedback', false)}
  `),

  /**
   * Shipment Exception - Delivery issue
   */
  shipmentException: (data: {
    trackingNumber: string;
    issue: string;
    details: string;
    action: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(255,107,107,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Delivery Exception</h1>
      <p style="color: #ff6b6b; font-size: 15px; font-weight: 600;">We're experiencing an issue with your shipment.</p>
    </div>

    ${infoBox('Tracking Number', data.trackingNumber, '📦')}

    <div style="background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3); border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #ff6b6b; font-size: 14px; font-weight: 600; margin-bottom: 8px;">⚠️ ${data.issue}</p>
      <p style="color: #888; font-size: 13px; line-height: 1.7;">${data.details}</p>
    </div>

    <div style="background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Recommended Action</p>
      <p style="color: #fff; font-size: 14px;">${data.action}</p>
    </div>

    ${button('https://admin.airpak-express.site/support?ref=' + data.trackingNumber, 'Contact Support')}
  `),

  /**
   * Welcome Email - New user onboarding
   */
  welcome: (data: {
    name: string;
    email: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(204,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Welcome to AirPak Express!</h1>
      <p style="color: #888; font-size: 15px;">Hello ${data.name}, we're excited to have you on board.</p>
    </div>

    <div style="background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">Getting Started</h3>
      <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start;">
        <div style="width: 32px; height: 32px; background: rgba(204,0,0,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #CC0000; font-weight: 700;">1</div>
        <div><p style="color: #fff; font-weight: 600; margin-bottom: 4px;">Create Your First Shipment</p><p style="color: #666; font-size: 13px;">Use our intuitive dashboard to schedule pickups and track deliveries.</p></div>
      </div>
      <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start;">
        <div style="width: 32px; height: 32px; background: rgba(204,0,0,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #CC0000; font-weight: 700;">2</div>
        <div><p style="color: #fff; font-weight: 600; margin-bottom: 4px;">Track in Real-Time</p><p style="color: #666; font-size: 13px;">Get instant updates on your shipments with live tracking.</p></div>
      </div>
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div style="width: 32px; height: 32px; background: rgba(204,0,0,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #CC0000; font-weight: 700;">3</div>
        <div><p style="color: #fff; font-weight: 600; margin-bottom: 4px;">Access AI Tools</p><p style="color: #666; font-size: 13px;">Leverage AI-powered analytics, document generation, and workflow automation.</p></div>
      </div>
    </div>

    ${button('https://shipnow.airpak-express.site/dashboard', 'Go to Dashboard')}
  `),

  /**
   * Invoice Generated - Payment notification
   */
  invoiceGenerated: (data: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    items: Array<{ description: string; amount: string }>;
  }) => {
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #ccc;">${item.description}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f1f1f; color: #fff; text-align: right;">${item.amount}</td>
      </tr>
    `).join('');

    return baseTemplate(`
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: rgba(204,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Invoice Generated</h1>
        <p style="color: #888; font-size: 15px;">Your invoice is ready for payment.</p>
      </div>

      ${infoBox('Invoice Number', data.invoiceNumber, '📄')}
      ${infoBox('Amount Due', data.amount, '💰')}
      ${infoBox('Due Date', data.dueDate, '📅')}

      <div style="margin: 32px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding: 16px 0; color: #fff; font-weight: 700; font-size: 16px;">Total</td>
            <td style="padding: 16px 0; color: #CC0000; font-weight: 700; font-size: 16px; text-align: right;">${data.amount}</td>
          </tr>
        </table>
      </div>

      ${button('https://admin.airpak-express.site/invoices/' + data.invoiceNumber, 'View Invoice')}
      ${button('https://admin.airpak-express.site/invoices/' + data.invoiceNumber + '/pay', 'Pay Now', true)}
    `);
  },

  /**
   * Password Reset - Security notification
   */
  passwordReset: (data: {
    name: string;
    resetLink: string;
    expiresIn: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(255,166,35,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFA623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Password Reset Request</h1>
      <p style="color: #888; font-size: 15px;">Hello ${data.name}, we received a request to reset your password.</p>
    </div>

    <div style="background: rgba(255,166,35,0.1); border: 1px solid rgba(255,166,35,0.3); border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #FFA623; font-size: 13px; font-weight: 600; margin-bottom: 12px;">⚠️ Security Notice</p>
      <p style="color: #888; font-size: 13px; line-height: 1.7;">
        If you didn't request this password reset, please ignore this email and consider changing your password
        as a precautionary measure. This link will expire in <strong style="color: #fff;">${data.expiresIn}</strong>.
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <p style="color: #666; font-size: 13px; margin-bottom: 16px;">Click the button below to reset your password:</p>
      ${button(data.resetLink, 'Reset Password')}
    </div>

    <div style="background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #666; font-size: 12px; line-height: 1.7;">
        For security reasons, this link can only be used once. If you need to reset your password again,
        please visit our website and request a new reset link.
      </p>
    </div>
  `),

  /**
   * 2FA Code - Verification email
   */
  twoFactorCode: (data: {
    code: string;
    expiresIn: string;
    deviceInfo?: string;
    location?: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(204,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">Verification Code</h1>
      <p style="color: #888; font-size: 15px;">Enter this code to complete your sign-in.</p>
    </div>

    <div style="background: #0a0a0a; border: 2px solid #CC0000; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
      <p style="color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">Your Verification Code</p>
      <p style="font-size: 48px; font-weight: 700; color: #CC0000; letter-spacing: 16px; font-family: 'SF Mono', 'Monaco', monospace;">${data.code}</p>
      <p style="color: #ff6b6b; font-size: 12px; margin-top: 16px; font-family: 'SF Mono', 'Monaco', monospace;">⚠️ Expires in ${data.expiresIn}</p>
    </div>

    ${data.deviceInfo ? infoBox('Device', data.deviceInfo, '💻') : ''}
    ${data.location ? infoBox('Location', data.location, '📍') : ''}

    <div style="background: rgba(0,200,83,0.1); border: 1px solid rgba(0,200,83,0.3); border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
      <p style="color: #888; font-size: 13px; line-height: 1.7;">
        <strong style="color: #00c853;">Security Tip:</strong> Never share this code with anyone. AirPak Express staff will never ask for your verification code.
      </p>
    </div>
  `),

  /**
   * Shipping Notification - General update
   */
  shippingNotification: (data: {
    title: string;
    message: string;
    trackingNumber?: string;
    actionText?: string;
    actionUrl?: string;
  }) => baseTemplate(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: rgba(204,0,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CC0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 12px; letter-spacing: -1px;">${data.title}</h1>
    </div>

    <div style="background: #0d0d0d; border: 1px solid #1f1f1f; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="color: #ccc; font-size: 15px; line-height: 1.8;">${data.message}</p>
    </div>

    ${data.trackingNumber ? infoBox('Tracking Number', data.trackingNumber, '📦') : ''}

    ${data.actionText && data.actionUrl ? button(data.actionUrl, data.actionText) : ''}
  `),
};

// Text versions (plaintext fallback)
export const EmailTemplatesText = {
  shipmentCreated: (data: any) => `
AIRPAK EXPRESS - SHIPMENT CREATED

Your shipment has been created successfully!

Tracking Number: ${data.trackingNumber}
Origin: ${data.origin}
Destination: ${data.destination}
Estimated Delivery: ${data.estimatedDelivery}
Carrier: ${data.carrier}

Track your shipment: https://shipnow.airpak-express.site/track?num=${data.trackingNumber}

---
© 2026 AirPak Express. Heart Bridge Org | Spokane, WA
  `,

  shipmentDelivered: (data: any) => `
AIRPAK EXPRESS - DELIVERY CONFIRMED ✓

Your package has been delivered!

Tracking Number: ${data.trackingNumber}
Delivered At: ${data.deliveredAt}
Signed By: ${data.signedBy}
Location: ${data.location}

Thank you for choosing AirPak Express!

---
© 2026 AirPak Express. Heart Bridge Org | Spokane, WA
  `,

  welcome: (data: any) => `
WELCOME TO AIRPAK EXPRESS!

Hello ${data.name},

We're excited to have you on board!

Getting Started:
1. Create Your First Shipment
2. Track in Real-Time
3. Access AI Tools

Go to Dashboard: https://shipnow.airpak-express.site/dashboard

---
© 2026 AirPak Express. Heart Bridge Org | Spokane, WA
  `,

  twoFactorCode: (data: any) => `
AIRPAK EXPRESS - VERIFICATION CODE

Your verification code is: ${data.code}

Expires in: ${data.expiresIn}

${data.deviceInfo ? `Device: ${data.deviceInfo}` : ''}
${data.location ? `Location: ${data.location}` : ''}

Never share this code with anyone.

---
© 2026 AirPak Express. Heart Bridge Org | Spokane, WA
  `,
};

export default EmailTemplates;

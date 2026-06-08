/**
 * AirPak Express - Professional SMS Templates
 * Clean, professional messaging without trial prefixes
 */

// SMS Template Types
export interface SMSTemplate {
  id: string;
  name: string;
  category: string;
  message: string;
  maxLength: number;
  description: string;
}

// Professional SMS Templates (No emojis to avoid MMS issues)
export const SMSTemplates: SMSTemplate[] = [
  {
    id: "shipment_created",
    name: "Shipment Created",
    category: "shipment",
    description: "Sent when a new shipment is created",
    message: "AirPak Express: Your shipment {tracking_number} has been created. Track at {track_url}",
    maxLength: 160
  },
  {
    id: "shipment_picked_up",
    name: "Package Picked Up",
    category: "shipment",
    description: "Sent when pickup is confirmed",
    message: "AirPak Express: Your package {tracking_number} has been picked up. ETA: {eta}",
    maxLength: 160
  },
  {
    id: "shipment_in_transit",
    name: "In Transit Update",
    category: "shipment",
    description: "Sent when package is in transit",
    message: "AirPak Express: Your package {tracking_number} is now in transit. Current location: {location}",
    maxLength: 160
  },
  {
    id: "shipment_out_for_delivery",
    name: "Out for Delivery",
    category: "shipment",
    description: "Sent when out for delivery",
    message: "AirPak Express: Great news! Your package {tracking_number} is out for delivery today.",
    maxLength: 160
  },
  {
    id: "shipment_delivered",
    name: "Delivery Confirmation",
    category: "shipment",
    description: "Sent when delivered",
    message: "AirPak Express: Your package {tracking_number} has been delivered! Signed by: {signed_by}",
    maxLength: 160
  },
  {
    id: "shipment_exception",
    name: "Delivery Exception",
    category: "shipment",
    description: "Sent when there's a delivery issue",
    message: "AirPak Express: There is an issue with your shipment {tracking_number}. Please call {support_phone} for assistance.",
    maxLength: 160
  },
  {
    id: "otp_code",
    name: "OTP Verification",
    category: "security",
    description: "One-time password for verification",
    message: "AirPak Express: Your verification code is {code}. Valid for 10 minutes. Do not share this code.",
    maxLength: 160
  },
  {
    id: "password_reset",
    name: "Password Reset",
    category: "security",
    description: "Password reset instructions",
    message: "AirPak Express: Reset your password using this link: {reset_url}. Link expires in 1 hour.",
    maxLength: 160
  },
  {
    id: "account_created",
    name: "Account Created",
    category: "onboarding",
    description: "Welcome message for new users",
    message: "AirPak Express: Welcome {name}! Your account has been created. Start shipping at {app_url}",
    maxLength: 160
  },
  {
    id: "delivery_reminder",
    name: "Delivery Reminder",
    category: "notification",
    description: "Reminder before delivery",
    message: "AirPak Express: Reminder - Your package {tracking_number} is arriving {eta}. Track: {track_url}",
    maxLength: 160
  },
  {
    id: "pickup_reminder",
    name: "Pickup Reminder",
    category: "notification",
    description: "Reminder to pick up package",
    message: "AirPak Express: Your package {tracking_number} is ready for pickup at {location}.",
    maxLength: 160
  },
  {
    id: "rate_us",
    name: "Rate Experience",
    category: "notification",
    description: "Request for delivery rating",
    message: "AirPak Express: How was your delivery experience? Share your feedback: {rating_url}",
    maxLength: 160
  },
  {
    id: "schedule_confirmed",
    name: "Schedule Confirmed",
    category: "notification",
    description: "Pickup schedule confirmation",
    message: "AirPak Express: Pickup scheduled for {date} at {time}. Confirmation #{confirmation_id}",
    maxLength: 160
  },
  {
    id: "payment_received",
    name: "Payment Confirmation",
    category: "invoice",
    description: "Payment received notification",
    message: "AirPak Express: Payment of {amount} received. Invoice #{invoice_id}. Thank you!",
    maxLength: 160
  },
  {
    id: "custom_message",
    name: "Custom Message",
    category: "general",
    description: "Send a custom message",
    message: "{custom_message}",
    maxLength: 320
  }
];

// SMS Service Class
export class SMSService {
  private templates: Map<string, SMSTemplate> = new Map();

  constructor() {
    SMSTemplates.forEach(t => this.templates.set(t.id, t));
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): SMSTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: string): SMSTemplate[] {
    return SMSTemplates.filter(t => t.category === category);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): SMSTemplate[] {
    return SMSTemplates;
  }

  /**
   * Get categories for filtering
   */
  getCategories(): string[] {
    return [...new Set(SMSTemplates.map(t => t.category))];
  }

  /**
   * Render template with variables
   */
  renderTemplate(templateId: string, variables: Record<string, string>): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    let message = template.message;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return message;
  }

  /**
   * Truncate message to max length
   */
  truncateMessage(message: string, maxLength: number = 160): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + "...";
  }

  /**
   * Validate phone number (E.164 format)
   */
  validatePhone(phone: string): boolean {
    // E.164 format: +[country code][number]
    const regex = /^\+[1-9]\d{9,14}$/;
    return regex.test(phone);
  }

  /**
   * Format phone number to E.164
   */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    // Already has + prefix
    if (phone.startsWith("+")) {
      return "+" + cleaned;
    }

    // US/Canada: 10 digits
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // US with 1 prefix: 11 digits
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`;
    }

    // International: 10+ digits
    if (cleaned.length >= 10) {
      return `+${cleaned}`;
    }

    // Invalid - return as-is
    return phone;
  }

  /**
   * Generate tracking URL
   */
  generateTrackUrl(trackingNumber: string): string {
    return `https://shipnow.airpak-express.site/track?num=${trackingNumber}`;
  }

  /**
   * Generate rating URL
   */
  generateRatingUrl(trackingNumber: string): string {
    return `https://shipnow.airpak-express.site/rate?ref=${trackingNumber}`;
  }

  /**
   * Generate reset URL
   */
  generateResetUrl(token: string): string {
    return `https://shipnow.airpak-express.site/reset?token=${token}`;
  }

  /**
   * Calculate character count and segments
   */
  getMessageInfo(message: string): { chars: number; segments: number; remaining: number } {
    const chars = message.length;
    const maxSingleSMS = 160;
    const maxMultiSMS = 153; // 67 chars per segment for multi-part

    if (chars <= maxSingleSMS) {
      return { chars, segments: 1, remaining: maxSingleSMS - chars };
    }

    const segments = Math.ceil(chars / maxMultiSMS);
    const remaining = (segments * maxMultiSMS) - chars;

    return { chars, segments, remaining };
  }
}

// Export singleton instance
export const smsService = new SMSService();
export default smsService;

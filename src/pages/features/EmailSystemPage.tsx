/**
 * AirPak Express - Advanced Email System Page
 * Complete email automation with template management, Zoho integration, and dark/light themes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Send,
  Mail,
  Inbox,
  SendHorizontal,
  Clock,
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye as ViewIcon,
  BarChart3,
  Zap,
  Loader2,
  X,
  ChevronDown,
  Moon,
  Sun,
  Palette,
  Save,
  Copy,
  Download,
  Upload,
  Check,
  Clock3,
  FileCode,
  Target,
  MailCheck,
  AlertTriangle,
  Bell,
  Globe,
  Shield,
  Play,
  Pause,
  Edit2,
  Trash,
  EyeOff,
} from 'lucide-react';
import { EmailTemplates } from '@/lib/emailTemplates';

type TabType = 'inbox' | 'sent' | 'scheduled' | 'templates' | 'automations' | 'settings';

interface Email {
  id: string;
  message_id: string | null;
  to: string;
  subject: string;
  preview: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sentAt: string;
  category: string;
  tracking_number: string | null;
  opens_count: number;
  clicks_count: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  thumbnail?: string;
  clicks: number;
  opens: number;
  lastUsed?: string;
}

// Pre-built templates with full HTML structure
const EMAIL_TEMPLATES_DATA: EmailTemplate[] = [
  { id: 'shipment_created', name: 'Shipment Created', subject: 'Your AirPak Express Shipment is Ready - {{tracking_number}}', category: 'Shipment', status: 'approved', clicks: 1245, opens: 3420, lastUsed: '2026-05-28' },
  { id: 'shipment_in_transit', name: 'In Transit Update', subject: 'Your Package is On the Way - {{tracking_number}}', category: 'Shipment', status: 'approved', clicks: 890, opens: 2150, lastUsed: '2026-05-27' },
  { id: 'shipment_delivered', name: 'Delivery Confirmation', subject: '✓ Delivered! Your AirPak Package Has Arrived - {{tracking_number}}', category: 'Shipment', status: 'approved', clicks: 1560, opens: 4100, lastUsed: '2026-05-28' },
  { id: 'shipment_exception', name: 'Delivery Exception', subject: '⚠️ Action Required - Delivery Issue with {{tracking_number}}', category: 'Shipment', status: 'approved', clicks: 234, opens: 890, lastUsed: '2026-05-26' },
  { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to AirPak Express, {{name}}!', category: 'Onboarding', status: 'approved', clicks: 450, opens: 1200, lastUsed: '2026-05-25' },
  { id: 'invoice_generated', name: 'Invoice Notification', subject: 'New Invoice from AirPak Express - #{{invoice_number}}', category: 'Invoice', status: 'approved', clicks: 678, opens: 1890, lastUsed: '2026-05-28' },
  { id: 'password_reset', name: 'Password Reset', subject: 'Reset Your AirPak Express Password', category: 'Security', status: 'approved', clicks: 123, opens: 456, lastUsed: '2026-05-24' },
  { id: 'two_factor_code', name: '2FA Verification', subject: 'Your AirPak Express Verification Code', category: 'Security', status: 'approved', clicks: 2340, opens: 5600, lastUsed: '2026-05-28' },
  { id: 'shipment_out_for_delivery', name: 'Out for Delivery', subject: '🚚 Your Package is Out for Delivery - {{tracking_number}}', category: 'Shipment', status: 'pending', clicks: 0, opens: 0 },
  { id: 'shipment_picked_up', name: 'Package Picked Up', subject: '📦 Your Package Has Been Picked Up - {{tracking_number}}', category: 'Shipment', status: 'draft', clicks: 0, opens: 0 },
  { id: 'rate_experience', name: 'Rate Your Experience', subject: '⭐ How was your delivery experience?', category: 'Feedback', status: 'draft', clicks: 0, opens: 0 },
  { id: 'account_verified', name: 'Account Verified', subject: '✅ Your Account Has Been Verified', category: 'Security', status: 'pending', clicks: 0, opens: 0 },
];

// Template variable definitions
const TEMPLATE_VARIABLES = [
  { key: '{{tracking_number}}', label: 'Tracking Number', example: 'APX123456789' },
  { key: '{{name}}', label: 'Customer Name', example: 'John Smith' },
  { key: '{{email}}', label: 'Customer Email', example: 'customer@email.com' },
  { key: '{{origin}}', label: 'Origin City', example: 'Los Angeles, CA' },
  { key: '{{destination}}', label: 'Destination City', example: 'New York, NY' },
  { key: '{{eta}}', label: 'Estimated Arrival', example: 'May 30, 2026' },
  { key: '{{carrier}}', label: 'Carrier Name', example: 'DHL Express' },
  { key: '{{delivered_at}}', label: 'Delivery Time', example: 'May 28, 2026 2:30 PM' },
  { key: '{{signed_by}}', label: 'Signed By', example: 'J. Smith' },
  { key: '{{code}}', label: 'Verification Code', example: '123456' },
  { key: '{{reset_link}}', label: 'Reset Link', example: 'https://...' },
  { key: '{{invoice_number}}', label: 'Invoice Number', example: 'INV-2026-0042' },
  { key: '{{amount}}', label: 'Invoice Amount', example: '$149.99' },
  { key: '{{due_date}}', label: 'Due Date', example: 'June 15, 2026' },
  { key: '{{location}}', label: 'Current Location', example: 'Distribution Center' },
  { key: '{{device_info}}', label: 'Device Info', example: 'Chrome on Windows' },
];

// Automations configuration
const AUTOMATIONS = [
  { id: 'auto_welcome', name: 'Welcome New Users', trigger: 'User Registration', status: 'active', emailsSent: 456, lastTrigger: '2026-05-28 09:15' },
  { id: 'auto_shipment_created', name: 'Shipment Created Notification', trigger: 'New Shipment Created', status: 'active', emailsSent: 2341, lastTrigger: '2026-05-28 10:30' },
  { id: 'auto_in_transit', name: 'In Transit Updates', trigger: 'Status Changed to In Transit', status: 'active', emailsSent: 5678, lastTrigger: '2026-05-28 10:45' },
  { id: 'auto_delivered', name: 'Delivery Confirmation', trigger: 'Status Changed to Delivered', status: 'active', emailsSent: 3456, lastTrigger: '2026-05-28 09:00' },
  { id: 'auto_exception', name: 'Delivery Exception Alert', trigger: 'Exception Occurred', status: 'active', emailsSent: 234, lastTrigger: '2026-05-27 14:20' },
  { id: 'auto_invoice', name: 'Invoice Generation', trigger: 'Invoice Created', status: 'active', emailsSent: 890, lastTrigger: '2026-05-28 08:00' },
  { id: 'auto_2fa', name: '2FA Verification', trigger: 'Login Attempt', status: 'active', emailsSent: 12450, lastTrigger: '2026-05-28 10:50' },
  { id: 'auto_feedback', name: 'Feedback Request', trigger: '48h After Delivery', status: 'paused', emailsSent: 2340, lastTrigger: '2026-05-26 12:00' },
];

// Zoho Email API Configuration
const ZOHO_CONFIG = {
  connected: true,
  email: 'admin@airpak-express.site',
  dailyLimit: 5000,
  usedToday: 1847,
  senderName: 'AirPak Express',
};

const EmailSystemPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(EMAIL_TEMPLATES_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [emailTheme, setEmailTheme] = useState<'dark' | 'light'>('dark');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalSent: 34567,
    deliveryRate: 98.5,
    openRate: 42.3,
    clickRate: 8.7,
  });

  // Tab counts
  const [counts, setCounts] = useState({
    inbox: 23,
    sent: 156,
    scheduled: 12,
    pendingApprovals: 3,
  });

  // Compose state
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: '',
    category: 'general',
    trackingNumber: '',
  });

  // Load initial data
  useEffect(() => {
    loadEmails();
  }, []);

  // Load emails
  const loadEmails = async () => {
    setIsLoading(true);
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 500));

    setEmails([
      { id: '1', message_id: null, to: 'customer@company.com', subject: 'Shipment Update - APX123456789', preview: 'Your shipment has been dispatched and is on its way...', status: 'delivered', sentAt: '2026-05-28 06:00', category: 'shipment', tracking_number: 'APX123456789', opens_count: 2, clicks_count: 1 },
      { id: '2', message_id: null, to: 'admin@airpak-express.site', subject: 'Invoice Generated - #INV-2026-0042', preview: 'Your invoice for $249.99 is now available for viewing...', status: 'sent', sentAt: '2026-05-28 05:30', category: 'invoice', tracking_number: null, opens_count: 0, clicks_count: 0 },
      { id: '3', message_id: null, to: 'newuser@example.com', subject: 'Welcome to AirPak Express', preview: 'Thank you for joining AirPak Express! Get started by...', status: 'opened', sentAt: '2026-05-28 04:00', category: 'onboarding', tracking_number: null, opens_count: 3, clicks_count: 2 },
      { id: '4', message_id: null, to: 'batch@customers.com', subject: 'Holiday Shipping Notice', preview: 'Please note our holiday schedule changes for the upcoming...', status: 'pending', sentAt: '2026-05-28 09:00', category: 'notification', tracking_number: null, opens_count: 0, clicks_count: 0 },
      { id: '5', message_id: null, to: 'driver@airpak-express.site', subject: 'Your Verification Code', preview: 'Your 2FA code is: 847291. This code expires in 10 minutes.', status: 'delivered', sentAt: '2026-05-28 10:30', category: 'security', tracking_number: null, opens_count: 1, clicks_count: 0 },
    ]);
    setIsLoading(false);
  };

  // Preview template with theme
  const previewTemplate = (templateId: string) => {
    let html = '';
    const theme = emailTheme === 'dark' ? { bg: '#111111', text: '#ffffff', accent: '#CC0000' } : { bg: '#ffffff', text: '#1a1a1a', accent: '#CC0000' };

    switch (templateId) {
      case 'shipment_created':
        html = EmailTemplates.shipmentCreated({
          trackingNumber: composeData.trackingNumber || 'APX123456789',
          origin: 'Los Angeles, CA',
          destination: 'New York, NY',
          estimatedDelivery: 'May 30, 2026',
          carrier: 'DHL Express'
        });
        break;
      case 'shipment_delivered':
        html = EmailTemplates.shipmentDelivered({
          trackingNumber: composeData.trackingNumber || 'APX123456789',
          deliveredAt: new Date().toLocaleString(),
          signedBy: 'J. Smith',
          location: 'Front Desk'
        });
        break;
      case 'welcome':
        html = EmailTemplates.welcome({
          name: 'Valued Customer',
          email: composeData.to
        });
        break;
      case 'two_factor_code':
        html = EmailTemplates.twoFactorCode({
          code: '123456',
          expiresIn: '10 minutes',
          deviceInfo: 'Chrome on Windows',
          location: 'Spokane, WA'
        });
        break;
      case 'shipment_exception':
        html = EmailTemplates.shipmentException({
          trackingNumber: composeData.trackingNumber || 'APX123456789',
          issue: 'Delivery Attempt Failed',
          details: 'Our delivery driver attempted to deliver your package but could not access the delivery location. Please ensure someone is available or reschedule delivery.',
          action: 'Contact support to reschedule delivery or provide alternative delivery instructions.'
        });
        break;
      case 'invoice_generated':
        html = EmailTemplates.invoiceGenerated({
          invoiceNumber: 'INV-2026-0042',
          amount: '$249.99',
          dueDate: 'June 15, 2026',
          items: [
            { description: 'International Shipping (5kg)', amount: '$149.99' },
            { description: 'Fuel Surcharge', amount: '$25.00' },
            { description: 'Insurance', amount: '$75.00' },
          ]
        });
        break;
      default:
        html = EmailTemplates.shippingNotification({
          title: composeData.subject || 'Notification',
          message: composeData.body || 'Your message here...',
          trackingNumber: composeData.trackingNumber || undefined
        });
    }

    setPreviewHtml(html);
    setShowPreview(true);
  };

  // Send email
  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) return;

    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newEmail: Email = {
      id: Date.now().toString(),
      message_id: 'MSG-' + Date.now(),
      to: composeData.to,
      subject: composeData.subject,
      preview: composeData.body.substring(0, 50),
      status: 'sent',
      sentAt: new Date().toISOString(),
      category: composeData.category,
      tracking_number: composeData.trackingNumber || null,
      opens_count: 0,
      clicks_count: 0,
    };

    setEmails([newEmail, ...emails]);
    setIsSending(false);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', body: '', category: 'general', trackingNumber: '' });
    setSelectedTemplate(null);
  };

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = EMAIL_TEMPLATES_DATA.find(t => t.id === templateId);
    if (template) {
      setComposeData({
        ...composeData,
        subject: template.subject,
        body: getTemplateBody(templateId),
        category: template.category.toLowerCase()
      });
      setSelectedTemplate(templateId);
    }
  };

  // Get template body preview
  const getTemplateBody = (templateId: string): string => {
    const bodies: Record<string, string> = {
      shipment_created: 'Your shipment {{tracking_number}} has been created and is being processed. Estimated delivery: {{eta}}',
      shipment_in_transit: 'Your package is on its way to {{destination}}. Current location: {{location}}. ETA: {{eta}}',
      shipment_delivered: 'Great news! Your shipment {{tracking_number}} has been delivered at {{delivered_at}} by {{signed_by}}.',
      shipment_exception: 'We encountered an issue with your shipment {{tracking_number}}. {{issue}}. Please {{action}}.',
      welcome: 'Welcome aboard, {{name}}! Thank you for choosing AirPak Express for your shipping needs.',
      invoice_generated: 'Your invoice #{{invoice_number}} for {{amount}} is now available. Due date: {{due_date}}.',
      password_reset: 'Click the link to reset your password: {{reset_link}}. This link expires in 24 hours.',
      two_factor_code: 'Your verification code is: {{code}}. Expires in {{expires_in}}.',
    };
    return bodies[templateId] || '';
  };

  // Filter emails
  const filteredEmails = emails.filter(email => {
    if (activeTab === 'sent') return ['sent', 'delivered', 'opened', 'clicked'].includes(email.status);
    if (activeTab === 'scheduled') return email.status === 'pending';
    if (searchQuery) {
      return email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
             email.subject.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-500/20 text-yellow-400', text: 'Scheduled', icon: <Clock className="w-3 h-3" /> },
      sent: { bg: 'bg-blue-500/20 text-blue-400', text: 'Sent', icon: <Send className="w-3 h-3" /> },
      delivered: { bg: 'bg-green-500/20 text-green-400', text: 'Delivered', icon: <CheckCircle className="w-3 h-3" /> },
      opened: { bg: 'bg-purple-500/20 text-purple-400', text: 'Opened', icon: <Eye className="w-3 h-3" /> },
      clicked: { bg: 'bg-cyan-500/20 text-cyan-400', text: 'Clicked', icon: <Zap className="w-3 h-3" /> },
      failed: { bg: 'bg-red-500/20 text-red-400', text: 'Failed', icon: <XCircle className="w-3 h-3" /> },
      bounced: { bg: 'bg-orange-500/20 text-orange-400', text: 'Bounced', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.bg}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  // Get template status badge
  const getTemplateStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-slate-500/20 text-slate-400', text: 'Draft' },
      pending: { bg: 'bg-yellow-500/20 text-yellow-400', text: 'Pending Review' },
      approved: { bg: 'bg-green-500/20 text-green-400', text: 'Approved' },
      rejected: { bg: 'bg-red-500/20 text-red-400', text: 'Rejected' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${badge.bg}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="h-full flex bg-slate-950">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Compose
          </button>
        </div>

        {/* Stats Cards */}
        <div className="px-4 pb-4 space-y-2">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">Delivery Rate</span>
              <TrendingUp className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.deliveryRate}%</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">Open Rate</span>
              <Eye className="w-3 h-3 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.openRate}%</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox },
            { id: 'sent', label: 'Sent', icon: SendHorizontal, count: counts.sent },
            { id: 'scheduled', label: 'Scheduled', icon: Clock3, count: counts.scheduled },
            { id: 'templates', label: 'Templates', icon: FileCode, count: emailTemplates.length },
            { id: 'automations', label: 'Automations', icon: Target, count: 8 },
            { id: 'settings', label: 'Settings', icon: Settings, count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600/20 text-red-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="px-2 py-0.5 bg-slate-700 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Zoho Status */}
        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${ZOHO_CONFIG.connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {ZOHO_CONFIG.connected ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="text-sm font-medium">Zoho {ZOHO_CONFIG.connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="mt-2 px-3 text-xs text-slate-500">
            {ZOHO_CONFIG.usedToday}/{ZOHO_CONFIG.dailyLimit} emails today
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab}</h2>
            {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm w-64 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <button onClick={loadEmails} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'templates' ? (
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Email Templates</h2>
                <p className="text-slate-400 text-sm mt-1">Manage and preview your email templates</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setEmailTheme('dark')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${emailTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                  <button
                    onClick={() => setEmailTheme('light')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${emailTheme === 'light' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Upload className="w-4 h-4" />
                  Import Template
                </button>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-red-500/50 transition-colors group"
                >
                  {/* Template Preview */}
                  <div className={`h-40 ${emailTheme === 'dark' ? 'bg-[#111111]' : 'bg-white'} flex items-center justify-center p-4 relative`}>
                    <div className={`text-center ${emailTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${emailTheme === 'dark' ? 'bg-red-600/20' : 'bg-red-100'}`}>
                        <Mail className={`w-6 h-6 ${emailTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                      </div>
                      <p className={`text-sm font-medium ${emailTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{template.name}</p>
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => { applyTemplate(template.id); setShowCompose(true); }} className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => previewTemplate(template.id)} className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">{template.category}</span>
                      {getTemplateStatusBadge(template.status)}
                    </div>
                    <h3 className="text-white font-medium mb-2">{template.name}</h3>
                    <p className="text-slate-500 text-xs truncate mb-3">{template.subject}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {template.opens.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {template.clicks.toLocaleString()}
                        </span>
                      </div>
                      {template.lastUsed && <span>Last: {template.lastUsed}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'automations' ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Email Automations</h2>
              <p className="text-slate-400 text-sm mt-1">Automated email triggers based on events</p>
            </div>

            {/* Automations List */}
            <div className="space-y-4">
              {AUTOMATIONS.map((automation) => (
                <div key={automation.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${automation.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        {automation.status === 'active' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{automation.name}</h3>
                        <p className="text-slate-400 text-sm">Trigger: {automation.trigger}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-medium">{automation.emailsSent.toLocaleString()}</p>
                        <p className="text-slate-500 text-xs">emails sent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">{automation.lastTrigger}</p>
                      </div>
                      <button className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${automation.status === 'active' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                        {automation.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-6">Email Settings</h2>

            {/* Zoho Configuration */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Zoho Mail Integration</h3>
                  <p className="text-slate-400 text-sm">Configure your Zoho SMTP settings</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">SMTP Host</label>
                  <input type="text" value="smtp.zoho.com" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" disabled />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Port</label>
                  <input type="text" value="465 (SSL)" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" disabled />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input type="email" value={ZOHO_CONFIG.email} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Sender Name</label>
                  <input type="text" value={ZOHO_CONFIG.senderName} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 ${ZOHO_CONFIG.connected ? 'text-green-400' : 'text-red-400'}`}>
                    {ZOHO_CONFIG.connected ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span className="text-sm">{ZOHO_CONFIG.connected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    Daily limit: {ZOHO_CONFIG.usedToday}/{ZOHO_CONFIG.dailyLimit}
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Update Settings
                </button>
              </div>
            </div>

            {/* Default Templates */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Default Templates</h3>
              <div className="space-y-3">
                {['shipment_created', 'shipment_delivered', 'two_factor_code', 'welcome', 'invoice_generated'].map((templateId) => {
                  const template = EMAIL_TEMPLATES_DATA.find(t => t.id === templateId);
                  return (
                    <div key={templateId} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCode className="w-4 h-4 text-slate-400" />
                        <span className="text-white text-sm">{template?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Mail className="w-12 h-12 mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => {
                    setComposeData({
                      to: email.to,
                      subject: `Re: ${email.subject}`,
                      body: '',
                      category: email.category,
                      trackingNumber: email.tracking_number || ''
                    });
                    setShowCompose(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{email.to}</span>
                      {email.tracking_number && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">{email.tracking_number}</span>
                      )}
                    </div>
                    {getStatusBadge(email.status)}
                  </div>
                  <p className="text-white text-sm mb-1 truncate">{email.subject}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-sm truncate flex-1">{email.preview}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 ml-4">
                      {email.opens_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {email.opens_count}
                        </span>
                      )}
                      {email.clicks_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {email.clicks_count}
                        </span>
                      )}
                      <span>{new Date(email.sentAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Compose Email</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedTemplate && previewTemplate(selectedTemplate)}
                  disabled={!selectedTemplate}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Template Selector */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">Select a template...</option>
                    {emailTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Variables Helper */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.slice(0, 8).map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setComposeData({ ...composeData, body: composeData.body + v.key })}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">To</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                  placeholder="recipient@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                  placeholder="Email subject"
                />
              </div>

              {/* Tracking Number */}
              {selectedTemplate?.startsWith('shipment') && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={composeData.trackingNumber}
                    onChange={(e) => setComposeData({ ...composeData, trackingNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                    placeholder="APX123456789"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Body</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white min-h-[200px] focus:outline-none focus:border-red-500/50"
                  placeholder="Write your email content... Use {'{{variable}}'} syntax for dynamic content"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex gap-3">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !composeData.to || !composeData.subject}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Email Preview</h3>
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setEmailTheme('dark')}
                    className={`px-3 py-1 rounded text-sm ${emailTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    <Moon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEmailTheme('light')}
                    className={`px-3 py-1 rounded text-sm ${emailTheme === 'light' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                  >
                    <Sun className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-700">
                  <Copy className="w-4 h-4" />
                  Copy HTML
                </button>
                <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-950">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[600px] border-0 rounded-lg"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSystemPage;
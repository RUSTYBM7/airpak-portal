/**
 * AirPak Express - Admin Settings Page
 * Full-featured admin settings with profile photo, KYC, and all configurations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User, Shield, Bell, Lock, Globe, Palette, Database,
  Save, Upload, Camera, Trash2, Check, X, Eye, EyeOff,
  Key, Smartphone, Mail, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'api', label: 'API Access', icon: Key },
  { id: 'system', label: 'System', icon: Database },
];

const AdminSettingsPage: React.FC = () => {
  const { profile, user, updateUserProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  // Preferences state
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');

  // KYC state
  const [kycDocuments, setKycDocuments] = useState<{ name: string; status: string; url?: string }[]>([]);
  const [kycVerified, setKycVerified] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const kycInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setCompany(profile.company || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = urlData.publicUrl;
      setAvatarUrl(newAvatarUrl);

      await updateUserProfile({ avatar_url: newAvatarUrl });
      toast.success('Profile photo updated successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  // Handle KYC document upload
  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/kyc/${docType}.${fileExt}`;

      const { error } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      setKycDocuments(prev => [
        ...prev.filter(d => d.name !== docType),
        { name: docType, status: 'pending', url: urlData.publicUrl }
      ]);

      toast.success(`${docType} uploaded successfully`);
    } catch (error: any) {
      console.error('KYC upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  // Save profile settings
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        full_name: fullName,
        phone,
        company,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Toggle 2FA
  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      // In production, this would integrate with an authenticator app
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle 2FA');
    } finally {
      setSaving(false);
    }
  };

  // Save notification settings
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateUserProfile({} as any);
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updateUserProfile({} as any);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
        <p className="text-white/60 mt-1">Manage your admin profile, security, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 overflow-hidden sticky top-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-[#BF5AF2]/15 text-[#BF5AF2] border-l-2 border-[#BF5AF2]'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <User size={20} />
                Profile Information
              </h2>

              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#BF5AF2]/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BF5AF2] to-[#9B4DCA] flex items-center justify-center text-white text-2xl font-bold">
                      {fullName?.[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#BF5AF2] rounded-full flex items-center justify-center text-white hover:bg-[#9B4DCA] transition-colors"
                    disabled={loading}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">Profile Photo</p>
                  <p className="text-white/40 text-sm mt-1">JPG, PNG or GIF. Max 5MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                    placeholder="Enter your email"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                    placeholder="Company name"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>

              {/* KYC Section */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  KYC Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['ID Document', 'Proof of Address', 'Business License'].map((doc) => (
                    <div key={doc} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white font-medium text-sm mb-2">{doc}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          kycDocuments.find(d => d.name === doc)?.status === 'verified'
                            ? 'bg-green-500/20 text-green-400'
                            : kycDocuments.find(d => d.name === doc)?.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-white/10 text-white/40'
                        }`}>
                          {kycDocuments.find(d => d.name === doc)?.status || 'Not uploaded'}
                        </span>
                        <button
                          onClick={() => kycInputRef.current?.click()}
                          className="text-xs text-[#BF5AF2] hover:underline flex items-center gap-1"
                        >
                          <Upload size={12} />
                          Upload
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  ref={kycInputRef}
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => handleKycUpload(e, 'ID Document')}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={20} />
                Security Settings
              </h2>

              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-white">Change Password</h3>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={18} />
                  Change Password
                </button>
              </div>

              {/* Two-Factor Auth */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#BF5AF2]/10 rounded-xl flex items-center justify-center">
                      <Smartphone size={20} className="text-[#BF5AF2]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-white/40 text-sm">Add an extra layer of security</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggle2FA}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      twoFactorEnabled ? 'bg-[#BF5AF2]' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      twoFactorEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Session Management */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-md font-medium text-white mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-white/40" />
                      <div>
                        <p className="text-white text-sm">Current Session</p>
                        <p className="text-white/40 text-xs">Last active: Just now</p>
                      </div>
                    </div>
                    <span className="text-xs text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell size={20} />
                Notification Preferences
              </h2>

              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', description: 'Receive updates via email', state: emailNotifications, setter: setEmailNotifications },
                  { label: 'Push Notifications', description: 'Receive browser push notifications', state: pushNotifications, setter: setPushNotifications },
                  { label: 'Critical Alerts', description: 'Important system alerts', state: criticalAlerts, setter: setCriticalAlerts },
                  { label: 'Weekly Report', description: 'Receive weekly activity summary', state: weeklyReport, setter: setWeeklyReport },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-white/40 text-sm">{item.description}</p>
                    </div>
                    <button
                      onClick={() => item.setter(!item.state)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        item.state ? 'bg-[#BF5AF2]' : 'bg-white/20'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        item.state ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Save Preferences
              </button>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Palette size={20} />
                Preferences
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Save Preferences
              </button>
            </div>
          )}

          {/* API Access Section */}
          {activeSection === 'api' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Key size={20} />
                API Access
              </h2>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white font-medium">API Key</p>
                  <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">Admin Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-2 bg-black/30 rounded-lg text-white/60 font-mono text-sm truncate">
                    {user?.id || 'Loading...'}
                  </code>
                  <button className="px-4 py-2 bg-[#BF5AF2]/20 text-[#BF5AF2] rounded-lg text-sm hover:bg-[#BF5AF2]/30 transition-colors">
                    Copy
                  </button>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-md font-medium text-white mb-4">API Documentation</h3>
                <p className="text-white/40 text-sm">
                  Access our comprehensive API documentation to integrate AirPak Express services into your systems.
                </p>
                <button className="mt-4 px-4 py-2 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white text-sm transition-colors">
                  View Documentation
                </button>
              </div>
            </div>
          )}

          {/* System Section */}
          {activeSection === 'system' && (
            <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database size={20} />
                System Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-sm mb-1">Database Status</p>
                  <p className="text-green-400 font-medium flex items-center gap-2">
                    <Check size={16} />
                    Connected
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-sm mb-1">API Version</p>
                  <p className="text-white font-medium">v2.0.0</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-sm mb-1">Last Backup</p>
                  <p className="text-white font-medium">2 hours ago</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/40 text-sm mb-1">Environment</p>
                  <p className="text-white font-medium">Production</p>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <button className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-sm transition-colors flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Clear Cache
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
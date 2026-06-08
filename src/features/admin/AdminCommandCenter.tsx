/**
 * AirPak Express - Admin Command Center
 * Full control panel for managing overrides, UI, flags, and announcements
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, Flag, Bell, Users, Package,
  Activity, AlertTriangle, CheckCircle, XCircle,
  Plus, Edit, Trash2, Eye, EyeOff, RefreshCw,
  Search, Filter, Download, Upload, Zap, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Override {
  id: number;
  target_type: string;
  target_id: string;
  action_type: string;
  params: Record<string, any>;
  reason?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
  admin_email?: string;
}

interface FeatureFlag {
  id: number;
  flag_key: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  params: Record<string, any>;
  created_at: string;
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'maintenance';
  target_pages: string[];
  active: boolean;
  starts_at: string;
  ends_at?: string;
}

// Tab Navigation
const tabs = [
  { id: 'overrides', label: 'Overrides', icon: Shield },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'logs', label: 'Action Logs', icon: Activity },
];

export const AdminCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overrides');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Data states
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'overrides' ? '/admin-overrides' :
                       activeTab === 'flags' ? '/feature-flags' :
                       activeTab === 'announcements' ? '/announcements' : '/logs';

      // Mock data for demo - replace with actual API calls
      if (activeTab === 'overrides') {
        setOverrides([
          { id: 1, target_type: 'shipment', target_id: 'APK123456', action_type: 'hold', params: {}, reason: 'Custom clearance required', active: true, created_at: new Date().toISOString() },
          { id: 2, target_type: 'user', target_id: 'user_123', action_type: 'block', params: {}, reason: 'Suspicious activity', active: true, created_at: new Date().toISOString() },
        ]);
      } else if (activeTab === 'flags') {
        setFlags([
          { id: 1, flag_key: 'ai_dispatch_v2', description: 'New AI dispatch algorithm', enabled: true, rollout_percentage: 50, params: {}, created_at: new Date().toISOString() },
          { id: 2, flag_key: 'new_pricing_engine', description: 'Dynamic pricing model', enabled: false, rollout_percentage: 0, params: {}, created_at: new Date().toISOString() },
        ]);
      } else if (activeTab === 'announcements') {
        setAnnouncements([
          { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on June 15th', type: 'warning', target_pages: ['*'], active: true, starts_at: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleOverride = async (id: number, active: boolean) => {
    try {
      // API call to toggle override
      toast.success(`Override ${active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update override');
    }
  };

  const toggleFlag = async (id: number, enabled: boolean) => {
    try {
      toast.success(`Feature flag ${enabled ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update flag');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#E31837] to-[#c8102e] rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Command Center</h1>
            <p className="text-slate-400 text-sm">Full control over system overrides, features, and announcements</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Shield} label="Active Overrides" value={overrides.filter(o => o.active).length} color="red" />
        <StatCard icon={Flag} label="Feature Flags" value={flags.filter(f => f.enabled).length} color="blue" />
        <StatCard icon={Bell} label="Announcements" value={announcements.filter(a => a.active).length} color="yellow" />
        <StatCard icon={Activity} label="Actions Today" value={12} color="green" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#E31837] text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#E31837]"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#E31837] hover:bg-[#c8102e] rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Create New
        </button>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overrides' && (
          <motion.div key="overrides" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <OverrideTable overrides={overrides} onToggle={toggleOverride} />
          </motion.div>
        )}
        {activeTab === 'flags' && (
          <motion.div key="flags" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FeatureFlagTable flags={flags} onToggle={toggleFlag} />
          </motion.div>
        )}
        {activeTab === 'announcements' && (
          <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AnnouncementTable announcements={announcements} />
          </motion.div>
        )}
        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ActionLogsTable />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateOverrideModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const StatCard: React.FC<{ icon: any; label: string; value: number; color: string }> = ({ icon: Icon, label, value, color }) => {
  const colors = {
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <Icon size={20} className="text-white/50" />
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
};

const OverrideTable: React.FC<{ overrides: Override[]; onToggle: (id: number, active: boolean) => void }> = ({ overrides, onToggle }) => (
  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
    <table className="w-full">
      <thead className="bg-white/5">
        <tr>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Target</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Action</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Reason</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {overrides.map(override => (
          <tr key={override.id} className="border-t border-white/5 hover:bg-white/5">
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-white/10 rounded text-xs">{override.target_type}</span>
              <span className="ml-2 font-mono text-sm">{override.target_id}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                override.action_type === 'hold' ? 'bg-yellow-500/20 text-yellow-400' :
                override.action_type === 'block' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {override.action_type}
              </span>
            </td>
            <td className="px-4 py-3 text-slate-400 text-sm">{override.reason || '-'}</td>
            <td className="px-4 py-3">
              <span className={`flex items-center gap-1 text-sm ${override.active ? 'text-green-400' : 'text-slate-500'}`}>
                {override.active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {override.active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-white/10 rounded"><Eye size={16} /></button>
                <button className="p-1.5 hover:bg-white/10 rounded"><Edit size={16} /></button>
                <button onClick={() => onToggle(override.id, !override.active)} className="p-1.5 hover:bg-white/10 rounded">
                  {override.active ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FeatureFlagTable: React.FC<{ flags: FeatureFlag[]; onToggle: (id: number, enabled: boolean) => void }> = ({ flags, onToggle }) => (
  <div className="grid gap-4">
    {flags.map(flag => (
      <div key={flag.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <code className="px-2 py-1 bg-[#E31837]/20 rounded text-[#E31837] font-mono text-sm">{flag.flag_key}</code>
            {flag.enabled && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">{flag.rollout_percentage}% rollout</span>}
          </div>
          <p className="text-slate-400 text-sm">{flag.description || 'No description'}</p>
        </div>
        <button
          onClick={() => onToggle(flag.id, !flag.enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${flag.enabled ? 'bg-[#E31837]' : 'bg-white/20'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${flag.enabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    ))}
  </div>
);

const AnnouncementTable: React.FC<{ announcements: Announcement[] }> = ({ announcements }) => (
  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
    <table className="w-full">
      <thead className="bg-white/5">
        <tr>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Title</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Type</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Pages</th>
          <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {announcements.map(ann => (
          <tr key={ann.id} className="border-t border-white/5">
            <td className="px-4 py-3">
              <div className="font-medium">{ann.title}</div>
              <div className="text-slate-400 text-sm truncate max-w-md">{ann.message}</div>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs ${
                ann.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                ann.type === 'error' ? 'bg-red-500/20 text-red-400' :
                ann.type === 'maintenance' ? 'bg-purple-500/20 text-purple-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>{ann.type}</span>
            </td>
            <td className="px-4 py-3 text-slate-400 text-sm">{ann.target_pages.join(', ')}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 rounded text-xs ${ann.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                {ann.active ? 'Active' : 'Inactive'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionLogsTable: React.FC = () => (
  <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center text-slate-400">
    <Activity className="mx-auto mb-3 opacity-50" size={48} />
    <p>Action logs will appear here</p>
    <p className="text-sm mt-1">All admin actions are logged automatically</p>
  </div>
);

const CreateOverrideModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ target_type: 'shipment', target_id: '', action_type: 'hold', reason: '' });

  const handleSubmit = async () => {
    try {
      toast.success('Override created successfully');
      onCreated();
    } catch (error) {
      toast.error('Failed to create override');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Create Override</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Target Type</label>
            <select
              value={form.target_type}
              onChange={(e) => setForm({ ...form, target_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value="shipment">Shipment</option>
              <option value="user">User</option>
              <option value="order">Order</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Target ID</label>
            <input
              type="text"
              value={form.target_id}
              onChange={(e) => setForm({ ...form, target_id: e.target.value })}
              placeholder="Enter tracking number or user ID"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Action</label>
            <select
              value={form.action_type}
              onChange={(e) => setForm({ ...form, action_type: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg"
            >
              <option value="hold">Hold</option>
              <option value="block">Block</option>
              <option value="update">Update</option>
              <option value="override">Override</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason for override..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg h-24"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 px-4 py-2.5 bg-[#E31837] rounded-lg">Create</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminCommandCenter;

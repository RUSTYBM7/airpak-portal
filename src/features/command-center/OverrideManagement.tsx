import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, X, Edit2, AlertOctagon, CheckCircle2, Clock, Ban } from 'lucide-react';
import {
  AdminOverride,
  getOverrides,
  createOverride,
  updateOverride,
  deactivateOverride,
  subscribeToOverrides,
  unsubscribeFromOverrides,
  CreateOverrideInput
} from '../../services/overrideService';
import { getCurrentUser } from '../../lib/supabase';

export const OverrideManagement: React.FC = () => {
  const [overrides, setOverrides] = useState<AdminOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<'shipment' | 'user' | 'pricing'>('shipment');
  const [targetId, setTargetId] = useState('');
  const [actionType, setActionType] = useState<'hold' | 'block' | 'price_adjust'>('hold');
  const [paramsJson, setParamsJson] = useState('{}');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchOverrides = async () => {
    try {
      setLoading(true);
      const data = await getOverrides();
      setOverrides(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overrides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverrides();

    const channel = subscribeToOverrides((payload) => {
      // Real-time update logic
      if (payload.eventType === 'INSERT') {
        setOverrides(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setOverrides(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      } else if (payload.eventType === 'DELETE') {
        setOverrides(prev => prev.filter(o => o.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribeFromOverrides(channel);
    };
  }, []);

  const handleOpenModal = (override?: AdminOverride) => {
    if (override) {
      setEditingId(override.id);
      setTargetType(override.target_type);
      setTargetId(override.target_id);
      setActionType(override.action_type);
      setParamsJson(JSON.stringify(override.params || {}, null, 2));
      setReason(override.reason);
      setExpiresAt(override.expires_at ? new Date(override.expires_at).toISOString().slice(0, 16) : '');
    } else {
      setEditingId(null);
      setTargetType('shipment');
      setTargetId('');
      setActionType('hold');
      setParamsJson('{}');
      setReason('');
      setExpiresAt('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramsJson);
      } catch (err) {
        throw new Error('Invalid JSON in parameters');
      }

      const input: CreateOverrideInput = {
        target_type: targetType,
        target_id: targetId,
        action_type: actionType,
        params: parsedParams,
        reason,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (editingId) {
        await updateOverride(editingId, input);
      } else {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        await createOverride(input, user.id);
      }

      setIsModalOpen(false);
      // Let realtime subscription handle the UI update or refetch
      fetchOverrides();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateOverride(id);
      fetchOverrides();
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate override');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-red-900/30">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-500" />
            Override Management
          </h2>
          <p className="text-slate-400 mt-1">Manage system-level overrides and interventions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Override
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400">
              <tr>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Target</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Expires</th>
                <th className="p-4 font-medium text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && overrides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading overrides...</td>
                </tr>
              ) : overrides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No overrides found.</td>
                </tr>
              ) : (
                overrides.map((override) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={override.id}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="p-4">
                      {override.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          <Ban className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-200 capitalize">{override.target_type}</div>
                      <div className="text-xs text-slate-500 font-mono">{override.target_id}</div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize text-blue-400">{override.action_type.replace('_', ' ')}</span>
                    </td>
                    <td className="p-4 max-w-xs truncate" title={override.reason}>
                      {override.reason}
                    </td>
                    <td className="p-4">
                      {override.expires_at ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(override.expires_at).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">Never</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(override)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {override.is_active && (
                        <button
                          onClick={() => handleDeactivate(override.id)}
                          className="p-1.5 text-red-400 hover:text-white hover:bg-red-600 rounded transition-colors"
                          title="Deactivate"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-lg w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {editingId ? 'Edit Override' : 'New Override'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Target Type</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="shipment">Shipment</option>
                    <option value="user">User</option>
                    <option value="pricing">Pricing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="hold">Hold</option>
                    <option value="block">Block</option>
                    <option value="price_adjust">Price Adjust</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Target ID</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                  placeholder="e.g. SHP-123456"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Reason for intervention..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Parameters (JSON)</label>
                <textarea
                  value={paramsJson}
                  onChange={(e) => setParamsJson(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Create Override'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

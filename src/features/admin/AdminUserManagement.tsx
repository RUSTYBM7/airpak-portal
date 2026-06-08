/**
 * AirPak Express - Admin User Management
 * Full user management with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Edit, Trash2, Eye, EyeOff,
  Plus, X, Check, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Phone, Building, Shield, AlertTriangle, Download,
  MoreVertical, UserCheck, UserX, Package, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  role: string;
  tier: string;
  region?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  status: string;
  created_at: string;
}

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userShipments, setUserShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0 });

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    company: '',
    role: 'user',
    tier: 'bronze',
    region: '',
    country_code: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterRole, filterTier]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((pagination.page - 1) * pagination.perPage, pagination.page * pagination.perPage - 1);

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }
      if (filterTier !== 'all') {
        query = query.eq('tier', filterTier);
      }
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setUsers(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserShipments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, tracking_number, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUserShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name,
      phone: user.phone || '',
      company: user.company || '',
      role: user.role,
      tier: user.tier,
      region: user.region || '',
      country_code: user.country_code || '',
    });
    setShowEditModal(true);
  };

  const handleViewDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    await fetchUserShipments(user.id);
    setShowUserDetails(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone || null,
          company: editForm.company || null,
          role: editForm.role,
          tier: editForm.tier,
          region: editForm.region || null,
          country_code: editForm.country_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update user role');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/60 mt-1">Manage all registered users and their accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white flex items-center gap-2 transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#BF5AF2]/50 focus:outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">User</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Contact</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Role</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Tier</th>
                <th className="text-left px-6 py-4 text-white/60 text-sm font-medium">Joined</th>
                <th className="text-right px-6 py-4 text-white/60 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    <RefreshCw size={24} className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BF5AF2] to-[#9B4DCA] flex items-center justify-center text-white font-bold">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.full_name}</p>
                          <p className="text-white/40 text-sm">{user.company || 'No company'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-white/60 text-sm flex items-center gap-2">
                          <Mail size={14} />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-white/40 text-sm flex items-center gap-2">
                            <Phone size={14} />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.tier === 'platinum' ? 'bg-yellow-500/20 text-yellow-400' :
                        user.tier === 'gold' ? 'bg-amber-500/20 text-amber-400' :
                        user.tier === 'silver' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-orange-500/20 text-orange-400'
                      }`}>
                        {user.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                          title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                        >
                          {user.role === 'admin' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 py-2 bg-white/5 rounded-lg text-white text-sm">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A2E] rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Company</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Tier</label>
                  <select
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Region</label>
                  <input
                    type="text"
                    value={editForm.region}
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Country</label>
                  <input
                    type="text"
                    value={editForm.country_code}
                    onChange={(e) => setEditForm({ ...editForm, country_code: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A2E] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button onClick={() => setShowUserDetails(false)} className="text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BF5AF2] to-[#9B4DCA] flex items-center justify-center text-white text-2xl font-bold">
                {selectedUser.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedUser.full_name}</h3>
                <p className="text-white/60">{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    selectedUser.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className="px-2 py-0.5 bg-[#BF5AF2]/20 text-[#BF5AF2] rounded-full text-xs capitalize">
                    {selectedUser.tier}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-sm mb-1">Phone</p>
                <p className="text-white">{selectedUser.phone || 'Not provided'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-sm mb-1">Company</p>
                <p className="text-white">{selectedUser.company || 'Not provided'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-sm mb-1">Region</p>
                <p className="text-white">{selectedUser.region || 'Not provided'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-sm mb-1">Country</p>
                <p className="text-white">{selectedUser.country_code || 'Not provided'}</p>
              </div>
            </div>

            {/* Shipments */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package size={18} />
                Recent Shipments ({userShipments.length})
              </h4>
              {userShipments.length === 0 ? (
                <p className="text-white/40 text-center py-4">No shipments found</p>
              ) : (
                <div className="space-y-2">
                  {userShipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-white font-mono">{shipment.tracking_number}</p>
                        <p className="text-white/40 text-sm">{new Date(shipment.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        shipment.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                        shipment.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {shipment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUserDetails(false);
                  handleOpenEdit(selectedUser);
                }}
                className="flex-1 px-4 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white transition-colors flex items-center justify-center gap-2"
              >
                <Edit size={18} />
                Edit User
              </button>
              <button
                onClick={() => setShowUserDetails(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
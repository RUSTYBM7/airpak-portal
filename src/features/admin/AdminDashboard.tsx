/**
 * AirPak Express - Admin Dashboard
 * Main admin dashboard with overview stats and management
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Users, Package, BarChart3, DollarSign, TrendingUp,
  AlertTriangle, Clock, CheckCircle, ArrowRight, Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShipments: 0,
    pendingApprovals: 0,
    revenue: 0,
    activeUsers: 0,
    inTransit: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch shipment count
        const { count: shipmentCount } = await supabase
          .from('shipments')
          .select('*', { count: 'exact', head: true });

        // Fetch pending tickets
        const { count: pendingCount } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'escalated');

        setStats({
          totalUsers: userCount || 0,
          totalShipments: shipmentCount || 0,
          pendingApprovals: pendingCount || 0,
          revenue: 12450,
          activeUsers: Math.floor((userCount || 0) * 0.7),
          inTransit: Math.floor((shipmentCount || 0) * 0.4)
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminStats = [
    { title: 'Total Users', value: stats.totalUsers.toLocaleString(), change: '+12%', icon: Users, color: 'bg-blue-500/10 text-blue-500' },
    { title: 'Active Shipments', value: stats.totalShipments.toLocaleString(), change: '+8%', icon: Package, color: 'bg-green-500/10 text-green-500' },
    { title: 'Pending Approvals', value: stats.pendingApprovals.toLocaleString(), change: 'Action needed', icon: AlertTriangle, color: 'bg-amber-500/10 text-amber-500' },
    { title: 'Revenue (USD)', value: `$${stats.revenue.toLocaleString()}`, change: '+15%', icon: DollarSign, color: 'bg-purple-500/10 text-purple-500' }
  ];

  const quickActions = [
    { label: 'View All Users', path: '/admin/portal/users', icon: Users },
    { label: 'Manage Shipments', path: '/admin/portal/shipments', icon: Package },
    { label: 'Analytics', path: '/admin/portal/analytics', icon: BarChart3 },
    { label: 'AI Invoices', path: '/admin/portal/ai-invoices', icon: DollarSign }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-[#BF5AF2] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/60 mt-1">Welcome back, {profile?.full_name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg">
            <Bell size={20} />
            {stats.pendingApprovals > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#BF5AF2] rounded-full text-white text-[10px] flex items-center justify-center">
                {stats.pendingApprovals}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat, index) => (
          <div key={index} className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#BF5AF2]/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/60">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-xs text-green-400 mt-2">{stat.change}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#BF5AF2]/10">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="flex items-center gap-3 p-4 bg-[#BF5AF2]/10 rounded-xl hover:bg-[#BF5AF2]/20 transition-colors text-left"
            >
              <action.icon size={20} className="text-[#BF5AF2]" />
              <span className="text-sm font-medium text-white">{action.label}</span>
              <ArrowRight size={16} className="ml-auto text-white/40" />
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#BF5AF2]/10">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { text: 'New user registration', time: '2 min ago', icon: Users },
              { text: 'Shipment delivered', time: '15 min ago', icon: Package },
              { text: 'Support ticket escalated', time: '1 hour ago', icon: AlertTriangle },
              { text: 'Payment received', time: '2 hours ago', icon: DollarSign }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02]">
                <div className="w-10 h-10 bg-[#BF5AF2]/10 rounded-xl flex items-center justify-center">
                  <activity.icon size={18} className="text-[#BF5AF2]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.text}</p>
                  <p className="text-xs text-white/40 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#BF5AF2]/10">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-4">
            {[
              { label: 'Database', status: 'Operational', uptime: '99.9%' },
              { label: 'API Services', status: 'Operational', uptime: '99.8%' },
              { label: 'Email Service', status: 'Operational', uptime: '99.5%' },
              { label: 'Payment Gateway', status: 'Operational', uptime: '100%' }
            ].map((system, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-white">{system.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-green-400">{system.status}</span>
                  <span className="text-xs text-white/40">{system.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Tools Overview */}
      <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-[#BF5AF2]/10">
        <h3 className="text-lg font-semibold text-white mb-4">AI Tools Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'AI Invoices', count: 24, color: 'bg-blue-500/10 text-blue-500' },
            { name: 'AI Documents', count: 18, color: 'bg-green-500/10 text-green-500' },
            { name: 'AI Creative', count: 12, color: 'bg-purple-500/10 text-purple-500' },
            { name: 'AI Analyst', count: 8, color: 'bg-amber-500/10 text-amber-500' }
          ].map((tool, index) => (
            <div key={index} className="p-4 bg-[#1A1A2E] rounded-xl border border-[#BF5AF2]/10 hover:border-[#BF5AF2]/20 transition-colors cursor-pointer">
              <p className="text-sm text-white/60">{tool.name}</p>
              <p className="text-2xl font-bold text-white mt-2">{tool.count}</p>
              <p className="text-xs text-white/40 mt-1">This month</p>
            </div>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default AdminDashboard;
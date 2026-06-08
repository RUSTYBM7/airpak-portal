/**
 * AirPak Express - Admin Portal Layout
 * Purple-themed sidebar layout with admin features
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Settings, LogOut, Menu, X,
  Bell, Search, Shield, FileText, BarChart3, Workflow, Mail, Smartphone,
  Plus, MessageSquare, Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminPortalLayoutProps {
  children?: React.ReactNode;
}

const AdminPortalLayout: React.FC<AdminPortalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { path: '/admin/portal', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/portal/users', icon: Users, label: 'User Management' },
    { path: '/admin/portal/create', icon: Plus, label: 'Create Shipment' },
    { path: '/admin/portal/chat', icon: MessageSquare, label: 'Live Chat' },
    { path: '/admin/portal/shipments', icon: Package, label: 'All Shipments' },
    { path: '/admin/portal/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/portal/ai-invoices', icon: FileText, label: 'AI Invoices' },
    { path: '/admin/portal/ai-documents', icon: FileText, label: 'AI Documents' },
    { path: '/admin/portal/ai-creative', icon: Workflow, label: 'AI Creative' },
    { path: '/admin/portal/email', icon: Mail, label: 'Email Hub' },
    { path: '/admin/portal/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A10] flex">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#1A1A2E] to-[#16162A] border-r border-[#BF5AF2]/10 z-50
        transform transition-transform duration-300 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-[#BF5AF2]/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#BF5AF2] to-[#9B4DCA] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">AirPak</span>
              <span className="text-xs font-medium text-[#BF5AF2] bg-[#BF5AF2]/10 px-2 py-0.5 rounded-full ml-1">Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          <div className="px-3 py-2 text-[10px] text-[#BF5AF2]/60 uppercase tracking-wider font-semibold">
            Main
          </div>
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                ${isActive(item.path, item.exact)
                  ? 'bg-[#BF5AF2]/15 text-[#BF5AF2]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}

          <div className="px-3 py-2 mt-4 text-[10px] text-[#BF5AF2]/60 uppercase tracking-wider font-semibold">
            AI Tools
          </div>
          {navItems.slice(3, 7).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                ${isActive(item.path, item.exact)
                  ? 'bg-[#BF5AF2]/15 text-[#BF5AF2]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}

          <div className="px-3 py-2 mt-4 text-[10px] text-[#BF5AF2]/60 uppercase tracking-wider font-semibold">
            System
          </div>
          {navItems.slice(7).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                ${isActive(item.path, item.exact)
                  ? 'bg-[#BF5AF2]/15 text-[#BF5AF2]'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#BF5AF2]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#BF5AF2] to-[#9B4DCA] rounded-full flex items-center justify-center text-white font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white truncate">{profile?.full_name || 'Admin'}</p>
              <p className="text-xs text-[#BF5AF2]">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#0A0A10]/90 backdrop-blur-xl border-b border-[#BF5AF2]/10 h-16 flex items-center px-4 lg:px-6 gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-white/50 hover:bg-white/[0.05] rounded-lg"
          >
            <Menu size={24} />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search users, shipments..."
              className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-[#BF5AF2]/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#BF5AF2]/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-white/50 hover:bg-white/[0.05] rounded-lg"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#BF5AF2] rounded-full text-white text-[10px] flex items-center justify-center">5</span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A2E] border border-[#BF5AF2]/10 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-[#BF5AF2]/10 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Admin Notifications</h3>
                    <button className="text-xs text-[#BF5AF2] hover:underline">View all</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 border-b border-[#BF5AF2]/10 hover:bg-white/[0.02] cursor-pointer">
                      <p className="text-sm text-white">New admin registration pending approval</p>
                      <p className="text-xs text-white/40 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-4 border-b border-[#BF5AF2]/10 hover:bg-white/[0.02] cursor-pointer">
                      <p className="text-sm text-white">System backup completed</p>
                      <p className="text-xs text-white/40 mt-1">5 hours ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminPortalLayout;

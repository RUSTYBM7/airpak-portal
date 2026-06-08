/**
 * AirPak Express - Global Store
 * Zustand store for global app state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  phone?: string;
  company?: string;
  avatar?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'shipment' | 'payment' | 'support' | 'system' | 'reward';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI State
  sidebarOpen: boolean;
  currentPage: string;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;

  // Notification Actions
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  setNotifications: (notifications: Notification[]) => void;

  // UI Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
}

// Demo user for development
const demoUser: User = {
  id: 'demo-user-001',
  email: 'john.doe@airpak.com',
  name: 'John Doe',
  role: 'user',
  tier: 'gold',
  phone: '+65 9876 5432',
  company: 'Doe Enterprises'
};

const demoNotifications: Notification[] = [
  {
    id: '1',
    title: 'Package arriving today',
    message: 'APK20240525001234 is out for delivery',
    type: 'shipment',
    read: false,
    actionUrl: '/tracking',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'Shipment delivered',
    message: 'APK20240524001233 delivered successfully',
    type: 'shipment',
    read: false,
    actionUrl: '/tracking',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Rewards unlocked',
    message: 'You earned 50 points!',
    type: 'reward',
    read: true,
    actionUrl: '/rewards',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state - NO demo user, use real auth from AuthContext
      user: null,
      isAuthenticated: false,
      isLoading: false,

      notifications: [],
      unreadCount: 0,

      sidebarOpen: false,
      currentPage: 'dashboard',

      // Auth Actions
      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        notifications: [],
        unreadCount: 0
      }),

      // Notification Actions
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.read ? 0 : 1)
      })),

      markNotificationRead: (id) => set((state) => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          };
        }
        return state;
      }),

      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      })),

      setNotifications: (notifications) => set({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      }),

      // UI Actions
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setCurrentPage: (currentPage) => set({ currentPage })
    }),
    {
      name: 'airpak-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        notifications: state.notifications,
        currentPage: state.currentPage
      })
    }
  )
);

// Selector hooks
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useUnreadCount = () => useAppStore((state) => state.unreadCount);

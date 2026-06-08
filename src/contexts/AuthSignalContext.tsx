import React, { createContext, useContext, useEffect, useState } from 'react';
import { authSignalRobot, AuthSignal } from '@/lib/AuthSignalRobot';
import toast from 'react-hot-toast';

interface AuthSignalContextType {
  status: 'green' | 'yellow' | 'red';
  lastSignal: AuthSignal | null;
}

const AuthSignalContext = createContext<AuthSignalContextType | undefined>(undefined);

export function AuthSignalProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'green' | 'yellow' | 'red'>(authSignalRobot.status);
  const [lastSignal, setLastSignal] = useState<AuthSignal | null>(null);

  useEffect(() => {
    const unsubscribe = authSignalRobot.subscribe((signal) => {
      setLastSignal(signal);
      setStatus(authSignalRobot.status);

      // Handle toast notifications based on signal type
      switch (signal.type) {
        case 'SIGNED_IN':
          toast.success('Successfully signed in across all tabs');
          break;
        case 'SIGNED_OUT':
          toast('Signed out. Your session has ended.', { icon: 'ℹ️' });
          break;
        case 'SESSION_EXPIRED':
          toast.error('Session expired. Please sign in again.');
          break;
        case 'TOKEN_REFRESHED':
          // Silently refresh
          break;
        case 'AUTH_ERROR':
          toast.error('Authentication error occurred');
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthSignalContext.Provider value={{ status, lastSignal }}>
      {children}
    </AuthSignalContext.Provider>
  );
}

export function useAuthSignal() {
  const context = useContext(AuthSignalContext);
  if (context === undefined) {
    throw new Error('useAuthSignal must be used within an AuthSignalProvider');
  }
  return context;
}

/**
 * AirPak Express - Authentication Context
 * Real Supabase authentication with profile management
 * Simplified version - works without Edge Functions
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, withRetry } from '../lib/supabase';

interface Profile {
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
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  csrfToken: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; rateLimited?: boolean }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; rateLimited?: boolean }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signInWithX: () => Promise<{ error: Error | null }>;
  signOut: (reason?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; rateLimited?: boolean }>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const LOCAL_PROFILE_KEY = 'airpak_local_profile';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// Helper for secure cookies
const setSecureCookie = (name: string, value: string, maxAgeSeconds: number) => {
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; samesite=strict; secure`;
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

const clearCookie = (name: string) => {
  document.cookie = `${name}=; max-age=0; path=/; samesite=strict; secure`;
};

// Generate CSRF Token
const generateCsrfToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle rate limit errors
  const checkRateLimit = (error: any) => {
    return error?.status === 429 || error?.message?.toLowerCase().includes('rate limit');
  };

  // Check if database is available
  const checkDatabase = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.log('Database schema issue detected or db unavailable, using local storage', error);
        return false;
      }

      return true;
    } catch (err) {
      console.log('Database not available, using local storage');
      return false;
    }
  }, []);

  // Create local profile in localStorage
  const createLocalProfile = (userId: string, email: string, name: string, company?: string): Profile => {
    const localProfile: Profile = {
      id: userId,
      email,
      full_name: name,
      company: company || '',
      role: 'user',
      tier: 'bronze',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
    return localProfile;
  };

  // Get local profile from localStorage
  const getLocalProfile = (): Profile | null => {
    try {
      const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.log('Error reading local profile');
    }
    return null;
  };

  // Create or get profile - with graceful fallback to localStorage
  const createOrGetProfile = useCallback(async (userId: string, email: string, name: string, company?: string) => {
    // First check if database is available (cache the result)
    if (dbAvailable === null) {
      const available = await checkDatabase();
      setDbAvailable(available);
    }

    // If database is not available or has schema issues, use localStorage
    if (dbAvailable === false) {
      const existing = getLocalProfile();
      if (existing && existing.id === userId) {
        setProfile(existing);
      } else {
        const newProfile = createLocalProfile(userId, email, name, company);
        setProfile(newProfile);
      }
      return;
    }

    try {
      // Try to get existing profile
      const { data: existingProfile, error: getError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        setProfile({
          ...existingProfile,
          full_name: existingProfile.full_name || existingProfile.name || name || 'User',
          email: email || existingProfile.email || '',
          role: existingProfile.role || 'user',
          tier: existingProfile.tier || 'bronze'
        } as Profile);
        return;
      }

      // If no profile found (PGRST116), create one
      if (getError?.code === 'PGRST116' || getError?.code === '22P02' || !existingProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: name || 'User'
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile({
            ...newProfile,
            full_name: newProfile.full_name || name || 'User',
            email: email,
            role: 'user',
            tier: 'bronze'
          } as Profile);
          return;
        }

        // If insert failed, use local profile
        console.log('Using local profile fallback', insertError);
        const localProfile = createLocalProfile(userId, email, name, company);
        setProfile(localProfile);
      } else if (getError) {
        // Some other error - use local profile
        console.log('Database error, using local profile:', getError.message);
        const localProfile = createLocalProfile(userId, email, name, company);
        setProfile(localProfile);
      }
    } catch (err) {
      console.log('Using local profile due to exception');
      const localProfile = createLocalProfile(userId, email, name, company);
      setProfile(localProfile);
    }
  }, [dbAvailable, checkDatabase]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize CSRF Token
        let token = getCookie('airpak_csrf');
        if (!token) {
          token = generateCsrfToken();
          setSecureCookie('airpak_csrf', token, 86400); // 1 day
        }
        setCsrfToken(token);

        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const u = currentSession.user;
          await createOrGetProfile(
            u.id,
            u.email || '',
            u.user_metadata?.full_name || u.email?.split('@')[0] || 'User'
          );
          setSecureCookie('airpak_session', 'active', 86400);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const u = session.user;
          await createOrGetProfile(
            u.id,
            u.email || '',
            u.user_metadata?.full_name || u.email?.split('@')[0] || 'User'
          );
          setSecureCookie('airpak_session', 'active', 86400);
        } else {
          setProfile(null);
          localStorage.removeItem(LOCAL_PROFILE_KEY);
          clearCookie('airpak_session');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [createOrGetProfile]);

  // Session Timeout Handling
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        signOut('timeout');
      }, SESSION_TIMEOUT_MS);
    }
  }, [user]);

  useEffect(() => {
    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    if (user) {
      resetInactivityTimer();
      events.forEach(event => window.addEventListener(event, handleActivity));
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [user, resetInactivityTimer]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        return { error: error as Error, rateLimited: checkRateLimit(error) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error, rateLimited: checkRateLimit(error) };
    }
  };

  // Sign up with email and password - direct Supabase auth
  const signUp = async (email: string, password: string, name: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const cleanEmail = email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { error, rateLimited: checkRateLimit(error) };
      }

      // If signup successful, create profile
      if (data.user) {
        await createOrGetProfile(data.user.id, cleanEmail, name);
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as Error, rateLimited: checkRateLimit(error) };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with Apple OAuth
  const signInWithApple = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with X (Twitter) OAuth
  const signInWithX = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/portal`,
        },
      });

      if (error) {
        return { error: error as Error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async (reason?: string) => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log('Error during signout:', err);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
    // Clear Supabase's local storage entries manually just in case
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
    // Clear any potential secure cookies
    clearCookie('airpak_csrf');
    clearCookie('airpak_session');

    if (reason === 'timeout') {
      // We can emit a custom event to notify the UI
      window.dispatchEvent(new CustomEvent('auth:timeout'));
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { error: new Error('You are currently offline. Please check your internet connection.') };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/#/reset-password`,
        }
      );

      if (error) {
        return { error, rateLimited: checkRateLimit(error) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error, rateLimited: checkRateLimit(error) };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Always update local profile first
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Try to update database if available
    if (dbAvailable) {
      try {
        await withRetry(async () => {
          const { error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (error) throw error;
        });

        // DB update succeeded
        return { error: null };
      } catch (err: any) {
        // DB update failed, but we already updated local
        console.error('Database update failed in updateUserProfile:', err);
      }
    }

    return { error: null };
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await createOrGetProfile(
        user.id,
        user.email || '',
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        csrfToken,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signInWithX,
        signOut,
        resetPassword,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

/**
 * Wales HQ Global Logistics - Supabase Client
 * Database connection and helper functions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Authentication and database functions will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
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
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      shipments: {
        Row: {
          id: string;
          user_id: string;
          tracking_number: string;
          status: string;
          origin: any;
          destination: any;
          current_location?: any;
          route_polyline?: string;
          carrier_tracking_url?: string;
          weight: number;
          service: string;
          estimated_delivery: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shipments']['Insert']>;
      };
      tracking_events: {
        Row: {
          id: string;
          shipment_id: string;
          tracking_number: string;
          status: string;
          location: string;
          timestamp: string;
          completed: boolean;
          lat?: number;
          lng?: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tracking_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tracking_events']['Insert']>;
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: 'ai_handling' | 'escalated' | 'resolved' | 'closed';
          priority: 'high' | 'medium' | 'low';
          ai_session_id?: string;
          ai_handled: boolean;
          escalation_reason?: string;
          assigned_admin?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['support_tickets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['support_tickets']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          sender_type: 'user' | 'ai' | 'admin';
          content: string;
          translated_content?: any;
          read_by: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
}

// Database operation retry helper
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRetryable = error.message?.includes('fetch') ||
                        error.code === '40001' || // serialization_failure
                        error.code === 'PGRST000' || // connection error
                        error.code === '53300' || // too_many_connections
                        error.status === 502 || error.status === 503 || error.status === 504;

    if (isRetryable && retries > 0) {
      console.warn(`Database operation failed, retrying in ${delay}ms... (${retries} retries left)`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 1.5); // Exponential backoff
    }

    // Formatting user-friendly errors
    let userMessage = 'An unexpected database error occurred.';
    if (error.code === '23505') userMessage = 'This record already exists.';
    else if (error.code === '23503') userMessage = 'A related record is missing.';
    else if (error.code === '42501') userMessage = 'Cannot delete this record because it is referenced elsewhere.';
    else if (error.message?.includes('fetch')) userMessage = 'Network error. Please check your connection and try again.';

    throw new DatabaseError(userMessage, error);
  }
};

// Helper functions
export const getProfile = async (userId: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, tier, avatar_url, company') // optimized selection
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  });
};

export const updateProfile = async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, role, tier, avatar_url, company') // optimized selection
      .single();

    if (error) throw error;
    return data;
  });
};

export const getShipments = async (userId?: string) => {
  return withRetry(async () => {
    let query = supabase
      .from('shipments')
      .select('id, tracking_number, status, origin, destination, estimated_delivery, created_at') // optimized selection
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
};

export const getShipmentByTracking = async (trackingNumber: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('id, tracking_number, status, origin, destination, weight, service, estimated_delivery, created_at, carrier_tracking_url, current_location') // optimized selection
      .eq('tracking_number', trackingNumber)
      .single();

    if (error) throw error;
    return data;
  });
};

export const getTrackingEvents = async (trackingNumber: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('tracking_events')
      .select('id, status, location, timestamp, completed, lat, lng') // optimized selection
      .eq('tracking_number', trackingNumber)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  });
};

export const createSupportTicket = async (userId: string, title: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        title,
        status: 'ai_handling',
        priority: 'medium',
        ai_handled: true,
      })
      .select('id, title, status, priority, created_at') // optimized selection
      .single();

    if (error) throw error;
    return data;
  });
};

export const getMessages = async (ticketId: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, sender_type, content, created_at') // optimized selection
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  });
};

export const sendMessage = async (
  ticketId: string,
  senderId: string,
  senderType: 'user' | 'ai' | 'admin',
  content: string
) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        sender_type: senderType,
        content,
        read_by: [senderId],
      })
      .select('id, sender_id, sender_type, content, created_at') // optimized selection
      .single();

    if (error) throw error;
    return data;
  });
};

// Create new shipment
export const createShipment = async (userId: string, shipmentData: {
  origin: any;
  destination: any;
  package: any;
  service: string;
  options: any;
  price: number;
}) => {
  return withRetry(async () => {
    const trackingNumber = `APK${Date.now().toString().slice(-10)}`;

    const { data, error } = await supabase
      .from('shipments')
      .insert({
        user_id: userId,
        tracking_number: trackingNumber,
        status: 'pending',
        origin: shipmentData.origin,
        destination: shipmentData.destination,
        weight: Number(shipmentData.package.weight) || 0,
        service: shipmentData.service,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, tracking_number, status, created_at, estimated_delivery')
      .single();

    if (error) throw error;
    return { ...data, tracking_number: trackingNumber };
  });
};

// Get user stats
export const getUserStats = async (userId: string) => {
  return withRetry(async () => {
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('status') // optimized selection
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: shipments?.length || 0,
      inTransit: shipments?.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length || 0,
      delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
      pending: shipments?.filter(s => s.status === 'pending').length || 0,
    };

    return stats;
  });
};

// Notifications
export const getNotifications = async (userId: string) => {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, title, status, created_at') // optimized selection
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  });
};

// Get current authenticated user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export default supabase;

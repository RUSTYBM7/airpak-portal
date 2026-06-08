/**
 * AirPak Express - Supabase API
 * All database operations for the portal
 */

import { supabase, Database } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// Types
type Profile = Database['public']['Tables']['profiles']['Row'];
type Shipment = Database['public']['Tables']['shipments']['Row'];
type TrackingEvent = Database['public']['Tables']['tracking_events']['Row'];
type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

// ==================== AUTH ====================

export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// ==================== PROFILES ====================

export const createProfile = async (userId: string, email: string, name: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: name,
      role: 'user',
      tier: 'bronze'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getProfile = async (userId: string): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ==================== SHIPMENTS ====================

export const generateTrackingNumber = () => {
  const prefix = 'APK';
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.random().toString().slice(2, 6);
  return `${prefix}${timestamp}${random}`;
};

export const createShipment = async (userId: string, shipmentData: {
  origin: { country: string; city: string; address?: string; postal_code?: string };
  destination: { country: string; city: string; address?: string; postal_code?: string };
  package: { weight: number; length?: number; width?: number; height?: number; description?: string; type?: 'document' | 'parcel' | 'pallet' };
  service: 'express' | 'standard' | 'economy';
  options?: { insurance?: boolean; priority_clearance?: boolean; signature_required?: boolean };
}) => {
  // Calculate estimated delivery based on service
  const deliveryDays = {
    express: 4,
    standard: 10,
    economy: 20
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays[shipmentData.service]);

  const trackingNumber = generateTrackingNumber();

  const { data, error } = await supabase
    .from('shipments')
    .insert({
      user_id: userId,
      tracking_number: trackingNumber,
      status: 'pending',
      origin: shipmentData.origin,
      destination: shipmentData.destination,
      weight: shipmentData.package.weight,
      service: shipmentData.service,
      estimated_delivery: estimatedDelivery.toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) throw error;

  // Create initial tracking event
  await createTrackingEvent(data.id, trackingNumber, {
    status: 'Order Created',
    location: `${shipmentData.origin.city}, ${shipmentData.origin.country}`,
    completed: true
  });

  return data;
};

export const getShipments = async (userId?: string): Promise<Shipment[]> => {
  let query = supabase
    .from('shipments')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getShipment = async (shipmentId: string): Promise<Shipment> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();
  if (error) throw error;
  return data;
};

export const getShipmentByTracking = async (trackingNumber: string): Promise<Shipment> => {
  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('tracking_number', trackingNumber)
    .single();
  if (error) throw error;
  return data;
};

export const updateShipmentStatus = async (shipmentId: string, status: Shipment['status']) => {
  const { data, error } = await supabase
    .from('shipments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', shipmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const cancelShipment = async (shipmentId: string) => {
  return updateShipmentStatus(shipmentId, 'exception');
};

export const deleteShipment = async (shipmentId: string) => {
  const { error } = await supabase
    .from('shipments')
    .delete()
    .eq('id', shipmentId);
  if (error) throw error;
};

// ==================== TRACKING EVENTS ====================

export const createTrackingEvent = async (
  shipmentId: string,
  trackingNumber: string,
  event: {
    status: string;
    location: string;
    completed?: boolean;
    lat?: number;
    lng?: number;
  }
) => {
  const { data, error } = await supabase
    .from('tracking_events')
    .insert({
      shipment_id: shipmentId,
      tracking_number: trackingNumber,
      status: event.status,
      location: event.location,
      timestamp: new Date().toISOString(),
      completed: event.completed ?? false,
      lat: event.lat,
      lng: event.lng
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getTrackingEvents = async (trackingNumber: string): Promise<TrackingEvent[]> => {
  const { data, error } = await supabase
    .from('tracking_events')
    .select('*')
    .eq('tracking_number', trackingNumber)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const updateTrackingEvent = async (eventId: string, updates: Partial<TrackingEvent>) => {
  const { data, error } = await supabase
    .from('tracking_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ==================== SUPPORT TICKETS ====================

export const createSupportTicket = async (
  userId: string,
  title: string,
  priority: 'high' | 'medium' | 'low' = 'medium'
): Promise<SupportTicket> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      title,
      status: 'ai_handling',
      priority,
      ai_handled: true
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getSupportTickets = async (userId?: string): Promise<SupportTicket[]> => {
  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getSupportTicket = async (ticketId: string): Promise<SupportTicket> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();
  if (error) throw error;
  return data;
};

export const updateSupportTicket = async (ticketId: string, updates: Partial<SupportTicket>) => {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const escalateTicket = async (ticketId: string, reason: string) => {
  return updateSupportTicket(ticketId, {
    status: 'escalated',
    escalation_reason: reason,
    ai_handled: false
  });
};

export const resolveTicket = async (ticketId: string) => {
  return updateSupportTicket(ticketId, { status: 'resolved' });
};

export const closeTicket = async (ticketId: string) => {
  return updateSupportTicket(ticketId, { status: 'closed' });
};

// ==================== MESSAGES ====================

export const getMessages = async (ticketId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const sendMessage = async (
  ticketId: string,
  senderId: string,
  senderType: 'user' | 'ai' | 'admin',
  content: string
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      read_by: [senderId]
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const markMessageRead = async (messageId: string, userId: string) => {
  const { data: msg } = await supabase
    .from('messages')
    .select('read_by')
    .eq('id', messageId)
    .single();

  if (msg && !msg.read_by.includes(userId)) {
    const { error } = await supabase
      .from('messages')
      .update({ read_by: [...msg.read_by, userId] })
      .eq('id', messageId);
    if (error) throw error;
  }
};

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'shipment' | 'payment' | 'support' | 'system' | 'reward';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
};

export const markAllNotificationsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
};

// ==================== ANALYTICS ====================

export const getDashboardStats = async (userId: string) => {
  const shipments = await getShipments(userId);

  const activeShipments = shipments.filter(s => !['delivered', 'returned'].includes(s.status));
  const deliveredShipments = shipments.filter(s => s.status === 'delivered');
  const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery');

  return {
    totalShipments: shipments.length,
    activeShipments: activeShipments.length,
    deliveredShipments: deliveredShipments.length,
    inTransitShipments: inTransit.length,
    recentShipments: shipments.slice(0, 5)
  };
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export const subscribeToShipment = (
  shipmentId: string,
  onUpdate: (shipment: Shipment) => void
) => {
  return supabase
    .channel(`shipment:${shipmentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
        filter: `id=eq.${shipmentId}`
      },
      (payload) => {
        onUpdate(payload.new as Shipment);
      }
    )
    .subscribe();
};

export const subscribeToMessages = (
  ticketId: string,
  onNewMessage: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${ticketId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ticket_id=eq.${ticketId}`
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();
};

export const subscribeToNotifications = (
  userId: string,
  onNewNotification: (notification: Notification) => void
) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe();
};

export default supabase;

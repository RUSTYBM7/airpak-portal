/**
 * AirPak Express - Shipments Store
 * Zustand store for shipments data with Supabase integration
 */

import { create } from 'zustand';
import { supabase } from './supabase';
import { generateTrackingNumber } from './api';

// Types
export interface Shipment {
  id: string;
  user_id: string;
  tracking_number: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'customs' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  origin: { country: string; city: string; address?: string; postal_code?: string };
  destination: { country: string; city: string; address?: string; postal_code?: string };
  current_location?: { lat: number; lng: number; name: string };
  route_polyline?: string;
  carrier_tracking_url?: string;
  weight: number;
  service: 'express' | 'standard' | 'economy';
  estimated_delivery: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  tracking_number: string;
  status: string;
  location: string;
  timestamp: string;
  completed: boolean;
  lat?: number;
  lng?: number;
}

interface ShipmentsState {
  shipments: Shipment[];
  currentShipment: Shipment | null;
  trackingEvents: TrackingEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchShipments: (userId?: string) => Promise<void>;
  fetchShipment: (id: string) => Promise<void>;
  fetchByTracking: (trackingNumber: string) => Promise<void>;
  fetchTrackingEvents: (trackingNumber: string) => Promise<void>;
  createShipment: (data: CreateShipmentData, userId: string) => Promise<Shipment>;
  updateShipment: (id: string, updates: Partial<Shipment>) => Promise<void>;
  clearError: () => void;
  setCurrentShipment: (shipment: Shipment | null) => void;
}

export interface CreateShipmentData {
  origin: { country: string; city: string; address?: string; postal_code?: string };
  destination: { country: string; city: string; address?: string; postal_code?: string };
  package: { weight: number; length?: number; width?: number; height?: number; description?: string; type?: 'document' | 'parcel' | 'pallet' };
  service: 'express' | 'standard' | 'economy';
  options?: { insurance?: boolean; priority_clearance?: boolean; signature_required?: boolean };
}

// Demo data
const demoShipments: Shipment[] = [
  {
    id: '1',
    user_id: 'demo-user-001',
    tracking_number: 'APK20240525001234',
    status: 'in_transit',
    origin: { country: 'Singapore', city: 'Singapore', address: '123 Orchard Road', postal_code: '238895' },
    destination: { country: 'United Kingdom', city: 'London', address: '456 Oxford Street', postal_code: 'W1D 1AS' },
    current_location: { lat: 51.4700, lng: -0.4543, name: 'London Heathrow' },
    weight: 2.5,
    service: 'express',
    estimated_delivery: '2024-05-28',
    created_at: '2024-05-23T10:00:00Z',
    updated_at: '2024-05-25T14:30:00Z'
  },
  {
    id: '2',
    user_id: 'demo-user-001',
    tracking_number: 'APK20240524001233',
    status: 'delivered',
    origin: { country: 'Singapore', city: 'Singapore' },
    destination: { country: 'Australia', city: 'Sydney', address: '789 George Street', postal_code: '2000' },
    weight: 1.2,
    service: 'standard',
    estimated_delivery: '2024-05-24',
    created_at: '2024-05-20T10:00:00Z',
    updated_at: '2024-05-24T10:00:00Z'
  },
  {
    id: '3',
    user_id: 'demo-user-001',
    tracking_number: 'APK20240523001232',
    status: 'pending',
    origin: { country: 'Singapore', city: 'Singapore' },
    destination: { country: 'United States', city: 'New York', address: '321 5th Avenue', postal_code: '10001' },
    weight: 3.0,
    service: 'express',
    estimated_delivery: '2024-05-30',
    created_at: '2024-05-23T10:00:00Z',
    updated_at: '2024-05-23T10:00:00Z'
  },
  {
    id: '4',
    user_id: 'demo-user-001',
    tracking_number: 'APK20240522001231',
    status: 'delivered',
    origin: { country: 'Singapore', city: 'Singapore' },
    destination: { country: 'Japan', city: 'Tokyo', address: '456 Shibuya', postal_code: '150-0002' },
    weight: 0.8,
    service: 'economy',
    estimated_delivery: '2024-05-22',
    created_at: '2024-05-18T10:00:00Z',
    updated_at: '2024-05-22T10:00:00Z'
  },
  {
    id: '5',
    user_id: 'demo-user-001',
    tracking_number: 'APK20240521001230',
    status: 'pending',
    origin: { country: 'Singapore', city: 'Singapore' },
    destination: { country: 'France', city: 'Paris', address: '123 Champs-Élysées', postal_code: '75008' },
    weight: 1.5,
    service: 'standard',
    estimated_delivery: '2024-05-31',
    created_at: '2024-05-21T10:00:00Z',
    updated_at: '2024-05-21T10:00:00Z'
  }
];

const demoTrackingEvents: TrackingEvent[] = [
  { id: '1', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Order Created', location: 'Singapore', timestamp: '2024-05-23T10:00:00Z', completed: true, lat: 1.3521, lng: 103.8198 },
  { id: '2', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Picked Up', location: 'Singapore', timestamp: '2024-05-23T10:00:00Z', completed: true, lat: 1.3521, lng: 103.8198 },
  { id: '3', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Customs Cleared', location: 'Singapore', timestamp: '2024-05-23T16:00:00Z', completed: true, lat: 1.3521, lng: 103.8198 },
  { id: '4', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Departed', location: 'Singapore', timestamp: '2024-05-24T08:00:00Z', completed: true, lat: 1.3644, lng: 103.9915 },
  { id: '5', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Arrived at Hub', location: 'London Heathrow', timestamp: '2024-05-25T14:30:00Z', completed: true, lat: 51.4700, lng: -0.4543 },
  { id: '6', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Customs Cleared', location: 'London', timestamp: '2024-05-26T06:00:00Z', completed: true, lat: 51.4700, lng: -0.4543 },
  { id: '7', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Out for Delivery', location: 'London', timestamp: '2024-05-28T08:00:00Z', completed: false, lat: 51.5074, lng: -0.1278 },
  { id: '8', shipment_id: '1', tracking_number: 'APK20240525001234', status: 'Delivered', location: 'London', timestamp: '2024-05-28T14:00:00Z', completed: false, lat: 51.5074, lng: -0.1278 }
];

export const useShipmentsStore = create<ShipmentsState>((set, get) => ({
  shipments: [], // Start with empty - fetch from Supabase
  currentShipment: null,
  trackingEvents: [],
  isLoading: false,
  error: null,

  fetchShipments: async (userId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Try to fetch from Supabase
      let query = supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Use real data if available, otherwise fall back to demo
      set({ shipments: data?.length ? data : demoShipments, isLoading: false });
    } catch (error: any) {
      console.log('Using demo data:', error.message);
      // Fall back to demo data
      set({ shipments: demoShipments, isLoading: false });
    }
  },

  fetchShipment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ currentShipment: data, isLoading: false });
    } catch (error: any) {
      console.log('Using demo data');
      const shipment = demoShipments.find(s => s.id === id);
      set({ currentShipment: shipment || null, isLoading: false });
    }
  },

  fetchByTracking: async (trackingNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .single();

      if (error) throw error;

      set({ currentShipment: data, isLoading: false });
    } catch (error: any) {
      console.log('Using demo data');
      const shipment = demoShipments.find(s => s.tracking_number === trackingNumber);
      set({ currentShipment: shipment || null, isLoading: false });
    }
  },

  fetchTrackingEvents: async (trackingNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('tracking_number', trackingNumber)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      set({ trackingEvents: data?.length ? data : demoTrackingEvents.filter(e => e.tracking_number === trackingNumber), isLoading: false });
    } catch (error: any) {
      console.log('Using demo tracking events');
      set({ trackingEvents: demoTrackingEvents.filter(e => e.tracking_number === trackingNumber), isLoading: false });
    }
  },

  createShipment: async (data: CreateShipmentData, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const trackingNumber = generateTrackingNumber();
      const deliveryDays = { express: 4, standard: 10, economy: 20 };
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays[data.service]);

      const { data: newShipment, error } = await supabase
        .from('shipments')
        .insert({
          user_id: userId,
          tracking_number: trackingNumber,
          status: 'pending',
          origin: data.origin,
          destination: data.destination,
          weight: data.package.weight,
          service: data.service,
          estimated_delivery: estimatedDelivery.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial tracking event
      await supabase.from('tracking_events').insert({
        shipment_id: newShipment.id,
        tracking_number: trackingNumber,
        status: 'Order Created',
        location: `${data.origin.city}, ${data.origin.country}`,
        timestamp: new Date().toISOString(),
        completed: true
      });

      // Update local state
      set(state => ({
        shipments: [newShipment, ...state.shipments],
        isLoading: false
      }));

      return newShipment;
    } catch (error: any) {
      // Create demo shipment locally
      const newShipment: Shipment = {
        id: Date.now().toString(),
        user_id: userId,
        tracking_number: generateTrackingNumber(),
        status: 'pending',
        origin: data.origin,
        destination: data.destination,
        weight: data.package.weight,
        service: data.service,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      set(state => ({
        shipments: [newShipment, ...state.shipments],
        isLoading: false
      }));

      return newShipment;
    }
  },

  updateShipment: async (id: string, updates: Partial<Shipment>) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        shipments: state.shipments.map(s => s.id === id ? { ...s, ...updates } : s)
      }));
    } catch (error) {
      console.error('Error updating shipment:', error);
    }
  },

  clearError: () => set({ error: null }),
  setCurrentShipment: (currentShipment) => set({ currentShipment })
}));

// Stats helper
export const getShipmentStats = (shipments: Shipment[]) => {
  const active = shipments.filter(s => !['delivered', 'returned'].includes(s.status));
  const delivered = shipments.filter(s => s.status === 'delivered');
  const inTransit = shipments.filter(s => ['in_transit', 'out_for_delivery'].includes(s.status));

  return {
    total: shipments.length,
    active: active.length,
    delivered: delivered.length,
    inTransit: inTransit.length
  };
};

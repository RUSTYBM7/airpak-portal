/**
 * AirPak Express - Admin Shipment Creation
 * Full-featured shipment creation for admins
 */

import React, { useState, useEffect } from 'react';
import {
  Package, MapPin, Truck, Clock, DollarSign, Check,
  ChevronRight, ChevronLeft, Search, User, Phone, Mail,
  FileText, Weight, Box, Navigation, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
}

interface Package {
  weight: number;
  length: number;
  width: number;
  height: number;
  description: string;
}

interface ShipmentForm {
  origin: Address;
  destination: Address;
  package: Package;
  service: string;
  priority: string;
  estimated_delivery: string;
  notes: string;
  user_id?: string;
}

const services = [
  { id: 'express', name: 'Express Delivery', time: '1-2 days', price: 1.5 },
  { id: 'standard', name: 'Standard Delivery', time: '3-5 days', price: 1.0 },
  { id: 'economy', name: 'Economy Delivery', time: '5-7 days', price: 0.7 },
  { id: 'freight', name: 'Freight', time: '7-14 days', price: 0.5 },
];

const priorities = [
  { id: 'low', name: 'Low Priority', discount: 0 },
  { id: 'medium', name: 'Medium Priority', discount: 10 },
  { id: 'high', name: 'High Priority', discount: 20 },
  { id: 'urgent', name: 'Urgent', discount: 30 },
];

const AdminShipmentCreate: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
   const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const [form, setForm] = useState<ShipmentForm>({
    origin: {
      name: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      phone: '',
      email: '',
    },
    destination: {
      name: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US',
      phone: '',
      email: '',
    },
    package: {
      weight: 1,
      length: 10,
      width: 10,
      height: 10,
      description: '',
    },
    service: 'standard',
    priority: 'medium',
    estimated_delivery: '',
    notes: '',
  });

  const calculatePrice = () => {
    const baseWeight = form.package.weight;
    const serviceData = services.find(s => s.id === form.service);
    const priorityData = priorities.find(p => p.id === form.priority);

    if (!serviceData) return 0;

    const basePrice = baseWeight * serviceData.price * 10;
    const priorityDiscount = priorityData?.discount || 0;

    return basePrice * (1 - priorityDiscount / 100);
  };

  const handleSearchUser = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUser(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, company')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleSelectUser = (userData: any) => {
    setSelectedUser(userData);
    setForm(prev => ({ ...prev, user_id: userData.id }));
    setShowUserSearch(false);
    toast.success(`Selected user: ${userData.full_name}`);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    if (!form.origin.name || !form.destination.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const trackingNumber = `APK${Date.now().toString().slice(-10)}`;

      // Calculate estimated delivery based on service
      const serviceData = services.find(s => s.id === form.service);
      const deliveryDays = serviceData?.time.split('-')[1] || '7';
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + parseInt(deliveryDays));

      const { data, error } = await supabase
        .from('shipments')
        .insert({
          user_id: form.user_id || user.id,
          tracking_number: trackingNumber,
          status: 'pending',
          origin: form.origin,
          destination: form.destination,
          weight: form.package.weight,
          service: form.service,
          estimated_delivery: estimatedDate.toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Shipment created! Tracking: ${trackingNumber}`);

      // Reset form
      setForm({
        origin: { name: '', street: '', city: '', state: '', postal_code: '', country: 'US', phone: '', email: '' },
        destination: { name: '', street: '', city: '', state: '', postal_code: '', country: 'US', phone: '', email: '' },
        package: { weight: 1, length: 10, width: 10, height: 10, description: '' },
        service: 'standard',
        priority: 'medium',
        estimated_delivery: '',
        notes: '',
      });
      setSelectedUser(null);
      setStep(1);
    } catch (error: any) {
      console.error('Create shipment error:', error);
      toast.error(error.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'User', icon: User },
    { id: 2, label: 'Origin', icon: MapPin },
    { id: 3, label: 'Destination', icon: Navigation },
    { id: 4, label: 'Package', icon: Box },
    { id: 5, label: 'Service', icon: Truck },
    { id: 6, label: 'Review', icon: Check },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create Shipment</h1>
        <p className="text-white/60 mt-1">Create a new shipment for any user</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step >= s.id
                    ? 'bg-[#BF5AF2] text-white'
                    : 'bg-white/10 text-white/40'
                }`}>
                  <s.icon size={18} />
                </div>
                <span className={`text-xs mt-2 ${step >= s.id ? 'text-white' : 'text-white/40'}`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.id ? 'bg-[#BF5AF2]' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-[#1A1A2E] rounded-2xl border border-[#BF5AF2]/10 p-6">
        {/* Step 1: User Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Select User (Optional)</h2>
            <p className="text-white/60">Search for a user or create shipment for any email</p>

            {selectedUser ? (
              <div className="bg-[#BF5AF2]/10 border border-[#BF5AF2]/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#BF5AF2] flex items-center justify-center text-white font-bold">
                      {selectedUser.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{selectedUser.full_name}</p>
                      <p className="text-white/60 text-sm">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-white/40 hover:text-white"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  onChange={(e) => handleSearchUser(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#BF5AF2]/50 focus:outline-none"
                />

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectUser(result)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#BF5AF2]/20 flex items-center justify-center text-[#BF5AF2]">
                          {result.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm">{result.full_name}</p>
                          <p className="text-white/40 text-xs">{result.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchingUser && (
                  <div className="mt-4 text-center text-white/40">
                    <RefreshCw size={20} className="animate-spin mx-auto" />
                  </div>
                )}
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">
                <AlertTriangle size={16} className="inline mr-2 text-yellow-400" />
                If no user is selected, the shipment will be created under your admin account.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Origin */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Origin Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={form.origin.name}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, name: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="Sender name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-2">Street Address</label>
                <input
                  type="text"
                  value={form.origin.street}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, street: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">City</label>
                <input
                  type="text"
                  value={form.origin.city}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, city: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">State</label>
                <input
                  type="text"
                  value={form.origin.state}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, state: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="NY"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={form.origin.postal_code}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, postal_code: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Country</label>
                <select
                  value={form.origin.country}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, country: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.origin.phone}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, phone: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="+1 555 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={form.origin.email}
                  onChange={(e) => setForm({ ...form, origin: { ...form.origin, email: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="sender@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Destination */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Destination Address</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={form.destination.name}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, name: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="Recipient name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/60 mb-2">Street Address</label>
                <input
                  type="text"
                  value={form.destination.street}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, street: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="456 Oak Ave"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">City</label>
                <input
                  type="text"
                  value={form.destination.city}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, city: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="Los Angeles"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">State</label>
                <input
                  type="text"
                  value={form.destination.state}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, state: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="CA"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={form.destination.postal_code}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, postal_code: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="90001"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Country</label>
                <select
                  value={form.destination.country}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, country: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Phone</label>
                <input
                  type="tel"
                  value={form.destination.phone}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, phone: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="+1 555 987 6543"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={form.destination.email}
                  onChange={(e) => setForm({ ...form, destination: { ...form.destination, email: e.target.value } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                  placeholder="recipient@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Package */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Package Details</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.package.weight}
                  onChange={(e) => setForm({ ...form, package: { ...form.package, weight: parseFloat(e.target.value) || 0 } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Length (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={form.package.length}
                  onChange={(e) => setForm({ ...form, package: { ...form.package, length: parseInt(e.target.value) || 0 } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Width (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={form.package.width}
                  onChange={(e) => setForm({ ...form, package: { ...form.package, width: parseInt(e.target.value) || 0 } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Height (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={form.package.height}
                  onChange={(e) => setForm({ ...form, package: { ...form.package, height: parseInt(e.target.value) || 0 } })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Package Description</label>
              <textarea
                value={form.package.description}
                onChange={(e) => setForm({ ...form, package: { ...form.package, description: e.target.value } })}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#BF5AF2]/50 focus:outline-none h-24 resize-none"
                placeholder="Describe the package contents..."
              />
            </div>

            <div className="bg-[#BF5AF2]/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Volumetric Weight</p>
              <p className="text-white text-2xl font-bold">
                {((form.package.length * form.package.width * form.package.height) / 5000).toFixed(2)} kg
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Service */}
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Select Service</h2>

            <div className="space-y-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setForm({ ...form, service: service.id })}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    form.service === service.id
                      ? 'bg-[#BF5AF2]/15 border-[#BF5AF2]/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-white/60 text-sm">{service.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#BF5AF2] font-bold">${(service.price * form.package.weight * 10).toFixed(2)}</p>
                      <p className="text-white/40 text-xs">${service.price}/kg</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-white mt-6">Priority</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {priorities.map((priority) => (
                <button
                  key={priority.id}
                  onClick={() => setForm({ ...form, priority: priority.id })}
                  className={`p-4 rounded-xl border transition-all ${
                    form.priority === priority.id
                      ? 'bg-[#BF5AF2]/15 border-[#BF5AF2]/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className="text-white font-medium">{priority.name}</p>
                  {priority.discount > 0 && (
                    <p className="text-green-400 text-sm">-{priority.discount}%</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Review & Create</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                  <MapPin size={16} /> Origin
                </p>
                <p className="text-white font-medium">{form.origin.name}</p>
                <p className="text-white/60 text-sm">
                  {form.origin.street}, {form.origin.city}, {form.origin.state} {form.origin.postal_code}
                </p>
              </div>

              {/* Destination */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                  <Navigation size={16} /> Destination
                </p>
                <p className="text-white font-medium">{form.destination.name}</p>
                <p className="text-white/60 text-sm">
                  {form.destination.street}, {form.destination.city}, {form.destination.state} {form.destination.postal_code}
                </p>
              </div>

              {/* Package */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                  <Package size={16} /> Package
                </p>
                <p className="text-white font-medium">{form.package.weight} kg</p>
                <p className="text-white/60 text-sm">
                  {form.package.length}x{form.package.width}x{form.package.height} cm
                </p>
              </div>

              {/* Service */}
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                  <Truck size={16} /> Service
                </p>
                <p className="text-white font-medium">
                  {services.find(s => s.id === form.service)?.name}
                </p>
                <p className="text-white/60 text-sm capitalize">{form.priority} priority</p>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-gradient-to-r from-[#BF5AF2]/20 to-[#9B4DCA]/20 rounded-xl p-6 border border-[#BF5AF2]/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Base Price</span>
                <span className="text-white">${(services.find(s => s.id === form.service)?.price || 0) * form.package.weight * 10}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Priority Discount</span>
                <span className="text-green-400">-{priorities.find(p => p.id === form.priority)?.discount || 0}%</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-white">Total</span>
                <span className="text-2xl font-bold text-[#BF5AF2]">${calculatePrice().toFixed(2)}</span>
              </div>
            </div>

            {form.notes && (
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-2">Notes</p>
                <p className="text-white">{form.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-[#BF5AF2] hover:bg-[#9B4DCA] rounded-xl text-white flex items-center gap-2 transition-colors"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-white flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
              Create Shipment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminShipmentCreate;
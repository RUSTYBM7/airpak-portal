// Carrier Simulation Service - Mock UI Templates
// NO real carrier APIs are called from frontend

export const CARRIER_TEMPLATES = [
  { id: 'dhl', name: 'DHL Express', primaryColor: '#D40511', secondaryColor: '#FFCC00' },
  { id: 'fedex', name: 'FedEx', primaryColor: '#4D148C', secondaryColor: '#FF6600' },
  { id: 'ups', name: 'UPS', primaryColor: '#351C15', secondaryColor: '#FFB500' },
  { id: 'usps', name: 'USPS', primaryColor: '#333366', secondaryColor: '#E71921' }
];

export function getCarrierTemplate(carrierId: string) {
  return CARRIER_TEMPLATES.find(c => c.id === carrierId);
}

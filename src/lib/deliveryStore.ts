// Bike Delivery Service Store — Supabase-backed with localStorage fallback
import { createClient } from '@/lib/supabase/client';

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DeliveryRider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  bikeType: 'motorcycle' | 'bicycle' | 'cargo_bike';
  serviceAreas: string[];
  pricePerKm: number;
  basePrice: number;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  createdAt: string;
}

export interface DeliveryRequest {
  id: string;
  orderId: string;
  riderId?: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  estimatedDistanceKm: number;
  deliveryFee: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const RIDERS_KEY = 'hapo_delivery_riders';
const REQUESTS_KEY = 'hapo_delivery_requests';

const MOCK_RIDERS: DeliveryRider[] = [
  {
    id: 'rider-001',
    userId: 'user-rider-001',
    name: 'Moses Kipchoge',
    phone: '+254711223344',
    email: 'moses@hapo.co.ke',
    bikeType: 'motorcycle',
    serviceAreas: ['Nairobi', 'Westlands', 'CBD Nairobi', 'Kasarani'],
    pricePerKm: 50,
    basePrice: 100,
    isAvailable: true,
    rating: 4.8,
    totalDeliveries: 142,
    location_lat: -1.2921,
    location_lng: 36.8219,
    city: 'Nairobi',
    createdAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'rider-002',
    userId: 'user-rider-002',
    name: 'Beatrice Achieng',
    phone: '+254722334455',
    email: 'beatrice@hapo.co.ke',
    bikeType: 'bicycle',
    serviceAreas: ['Westlands', 'Parklands', 'Lavington'],
    pricePerKm: 30,
    basePrice: 80,
    isAvailable: true,
    rating: 4.6,
    totalDeliveries: 87,
    location_lat: -1.2673,
    location_lng: 36.8063,
    city: 'Westlands',
    createdAt: '2026-07-05T10:00:00Z',
  },
];

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function mapRiderRow(row: any): DeliveryRider {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    bikeType: row.bike_type,
    serviceAreas: row.service_areas || [],
    pricePerKm: row.price_per_km,
    basePrice: row.base_price,
    isAvailable: row.is_available,
    rating: row.rating,
    totalDeliveries: row.total_deliveries,
    location_lat: row.location_lat,
    location_lng: row.location_lng,
    city: row.city,
    createdAt: row.created_at,
  };
}

function loadRiders(): DeliveryRider[] {
  if (typeof window === 'undefined') return MOCK_RIDERS;
  try {
    const raw = localStorage.getItem(RIDERS_KEY);
    if (!raw) {
      localStorage.setItem(RIDERS_KEY, JSON.stringify(MOCK_RIDERS));
      return MOCK_RIDERS;
    }
    return JSON.parse(raw);
  } catch {
    return MOCK_RIDERS;
  }
}

function saveRiders(riders: DeliveryRider[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RIDERS_KEY, JSON.stringify(riders));
}

export async function getAllRidersAsync(): Promise<DeliveryRider[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_riders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const riders = data.map(mapRiderRow);
        saveRiders(riders);
        return riders;
      }
    } catch {}
  }
  return loadRiders();
}

export async function getAvailableRidersAsync(): Promise<DeliveryRider[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_riders')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });
      if (!error && data) return data.map(mapRiderRow);
    } catch {}
  }
  return loadRiders().filter((r) => r.isAvailable);
}

export async function getRiderByUserIdAsync(userId: string): Promise<DeliveryRider | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_riders')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return mapRiderRow(data);
    } catch {}
  }
  return loadRiders().find((r) => r.userId === userId) || null;
}

export async function registerRiderAsync(
  rider: Omit<DeliveryRider, 'id' | 'rating' | 'totalDeliveries' | 'createdAt'>
): Promise<DeliveryRider> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_riders')
        .upsert(
          {
            user_id: rider.userId,
            name: rider.name,
            phone: rider.phone,
            email: rider.email,
            bike_type: rider.bikeType,
            service_areas: rider.serviceAreas,
            price_per_km: rider.pricePerKm,
            base_price: rider.basePrice,
            is_available: rider.isAvailable,
            location_lat: rider.location_lat,
            location_lng: rider.location_lng,
            city: rider.city,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (!error && data) {
        const newRider = mapRiderRow(data);
        const riders = loadRiders();
        const idx = riders.findIndex((r) => r.userId === rider.userId);
        if (idx !== -1) riders[idx] = newRider;
        else riders.unshift(newRider);
        saveRiders(riders);
        return newRider;
      }
    } catch (e) {
      console.warn('registerRider Supabase error:', e);
    }
  }
  // Fallback
  const newRider: DeliveryRider = {
    ...rider,
    id: `rider-${Date.now()}`,
    rating: 5.0,
    totalDeliveries: 0,
    createdAt: new Date().toISOString(),
  };
  const riders = loadRiders();
  riders.unshift(newRider);
  saveRiders(riders);
  return newRider;
}

export async function updateRiderAvailabilityAsync(
  riderId: string,
  isAvailable: boolean
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('delivery_riders')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', riderId);
    } catch {}
  }
  const riders = loadRiders();
  const idx = riders.findIndex((r) => r.id === riderId);
  if (idx !== -1) {
    riders[idx].isAvailable = isAvailable;
    saveRiders(riders);
  }
}

export async function getDeliveryRequestsByRiderAsync(riderId: string): Promise<DeliveryRequest[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .select('*')
        .eq('rider_id', riderId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          orderId: row.order_id || '',
          riderId: row.rider_id,
          clientName: row.client_name,
          clientPhone: row.client_phone,
          pickupAddress: row.pickup_address,
          pickupLat: row.pickup_lat,
          pickupLng: row.pickup_lng,
          deliveryAddress: row.delivery_address,
          deliveryLat: row.delivery_lat,
          deliveryLng: row.delivery_lng,
          estimatedDistanceKm: row.estimated_distance_km,
          deliveryFee: row.delivery_fee,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch {}
  }
  return [];
}

export async function createDeliveryRequestAsync(
  req: Omit<DeliveryRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<DeliveryRequest> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          order_id: req.orderId,
          rider_id: req.riderId || null,
          client_name: req.clientName,
          client_phone: req.clientPhone,
          pickup_address: req.pickupAddress,
          pickup_lat: req.pickupLat,
          pickup_lng: req.pickupLng,
          delivery_address: req.deliveryAddress,
          delivery_lat: req.deliveryLat,
          delivery_lng: req.deliveryLng,
          estimated_distance_km: req.estimatedDistanceKm,
          delivery_fee: req.deliveryFee,
          notes: req.notes,
        })
        .select()
        .single();
      if (!error && data) {
        return {
          id: data.id,
          orderId: data.order_id || '',
          riderId: data.rider_id,
          clientName: data.client_name,
          clientPhone: data.client_phone,
          pickupAddress: data.pickup_address,
          pickupLat: data.pickup_lat,
          pickupLng: data.pickup_lng,
          deliveryAddress: data.delivery_address,
          deliveryLat: data.delivery_lat,
          deliveryLng: data.delivery_lng,
          estimatedDistanceKm: data.estimated_distance_km,
          deliveryFee: data.delivery_fee,
          status: data.status,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
  }
  // Fallback
  const requests = loadRequests();
  const newReq: DeliveryRequest = {
    ...req,
    id: `del-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.unshift(newReq);
  saveRequests(requests);
  return newReq;
}

function loadRequests(): DeliveryRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveRequests(requests: DeliveryRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function calculateDeliveryFee(rider: DeliveryRider, distanceKm: number): number {
  return Math.round(rider.basePrice + rider.pricePerKm * distanceKm);
}

export function saveRiderProfile(rider: DeliveryRider): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hapo_rider_profile', JSON.stringify(rider));
}

export function getRiderProfile(): DeliveryRider | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('hapo_rider_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Sync wrappers for backward compatibility
export function getAllRiders(): DeliveryRider[] {
  return loadRiders();
}
export function getAvailableRiders(): DeliveryRider[] {
  return loadRiders().filter((r) => r.isAvailable);
}
export function getRiderById(id: string): DeliveryRider | null {
  return loadRiders().find((r) => r.id === id) || null;
}
export function registerRider(
  rider: Omit<DeliveryRider, 'id' | 'rating' | 'totalDeliveries' | 'createdAt'>
): DeliveryRider {
  const newRider: DeliveryRider = {
    ...rider,
    id: `rider-${Date.now()}`,
    rating: 5.0,
    totalDeliveries: 0,
    createdAt: new Date().toISOString(),
  };
  const riders = loadRiders();
  riders.unshift(newRider);
  saveRiders(riders);
  registerRiderAsync(rider);
  return newRider;
}
export function updateRiderAvailability(riderId: string, isAvailable: boolean): void {
  updateRiderAvailabilityAsync(riderId, isAvailable);
}
export function createDeliveryRequest(
  req: Omit<DeliveryRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): DeliveryRequest {
  const requests = loadRequests();
  const newReq: DeliveryRequest = {
    ...req,
    id: `del-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.unshift(newReq);
  saveRequests(requests);
  createDeliveryRequestAsync(req);
  return newReq;
}
export function getDeliveryRequestsByOrder(orderId: string): DeliveryRequest[] {
  return loadRequests().filter((r) => r.orderId === orderId);
}

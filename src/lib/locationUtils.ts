// Location utilities for GPS calibration and distance calculation
import { createClient } from '@/lib/supabase/client';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  city?: string;
}

export type LocationStatus = 'idle' | 'detecting' | 'success' | 'denied' | 'error';

/**
 * Request the user's real GPS location via browser Geolocation API
 */
export function detectUserLocation(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Reverse geocode lat/lng to a city name using OpenStreetMap Nominatim (free, no key needed)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const addr = data.address || {};
    return (
      addr.suburb ||
      addr.neighbourhood ||
      addr.city_district ||
      addr.town ||
      addr.city ||
      addr.county ||
      ''
    );
  } catch {
    return '';
  }
}

/**
 * Save location to localStorage for the current user session
 */
export async function saveUserLocation(lat: number, lng: number, city: string): Promise<void> {
  // Save to localStorage (for legacy components)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('hapo_auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        user.location_lat = lat;
        user.location_lng = lng;
        if (city) user.city = city;
        localStorage.setItem('hapo_auth_user', JSON.stringify(user));
      }
    } catch {}
  }

  // Save to Supabase user_profiles
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_profiles')
        .update({
          location_lat: lat,
          location_lng: lng,
          city: city || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }
  } catch {}
}

/**
 * Haversine distance in km between two coordinates
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

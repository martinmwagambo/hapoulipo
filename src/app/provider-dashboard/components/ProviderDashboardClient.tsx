'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { getAuthUser } from '@/lib/authStore';
import {
  MapPin,
  Wifi,
  WifiOff,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  Navigation,
  Phone,
  MessageCircle,
  Wrench,
  Truck,
  AlertCircle,
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  business_name: string;
  provider_type: string;
  county: string;
  sub_county: string | null;
  latitude: number;
  longitude: number;
  is_online: boolean;
  rating: number;
  base_fee_kes: number;
  per_km_fee_kes: number;
  service_radius_km: number;
  whatsapp_number: string;
  phone: string;
}

interface ServiceRequest {
  id: string;
  request_type: string;
  status: string;
  problem_desc: string;
  pickup_address: string;
  dropoff_address: string | null;
  vehicle_type: string;
  vehicle_plate: string;
  total_kes: number;
  distance_km: number;
  created_at: string;
  user_id: string;
}

interface NearbyProvider {
  id: string;
  business_name: string;
  provider_type: string;
  county: string;
  distance_km: number;
  rating: number;
  is_online: boolean;
  phone: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  on_way: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProviderDashboardClient() {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'nearby' | 'location'>(
    'overview'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const supabase = createClient();
  const user = getAuthUser();

  const loadProvider = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase
        .from('service_providers')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();
      if (err) throw err;
      setProvider(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load provider profile');
    }
  }, [user, supabase]);

  const loadRequests = useCallback(
    async (providerId: string) => {
      try {
        const { data, error: err } = await supabase
          .from('service_requests')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (err) throw err;
        setRequests(data || []);
      } catch (e: any) {
        console.error('Failed to load requests:', e.message);
      }
    },
    [supabase]
  );

  const loadNearbyProviders = useCallback(
    async (prov: ServiceProvider) => {
      if (!prov.latitude || !prov.longitude) return;
      try {
        const { data, error: err } = await supabase.rpc('get_nearest_providers', {
          p_user_lat: prov.latitude,
          p_user_lng: prov.longitude,
          p_type: prov.provider_type,
          p_user_county: prov.county,
        });
        if (err) throw err;
        // Exclude self
        setNearbyProviders((data || []).filter((p: NearbyProvider) => p.id !== prov.id));
      } catch (e: any) {
        console.error('Failed to load nearby providers:', e.message);
      }
    },
    [supabase]
  );

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadProvider();
      setLoading(false);
    }
    init();
  }, [loadProvider]);

  useEffect(() => {
    if (provider) {
      loadRequests(provider.id);
      loadNearbyProviders(provider);
    }
  }, [provider, loadRequests, loadNearbyProviders]);

  const toggleOnline = async () => {
    if (!provider) return;
    setTogglingOnline(true);
    try {
      const { error: err } = await supabase
        .from('service_providers')
        .update({ is_online: !provider.is_online, updated_at: new Date().toISOString() })
        .eq('id', provider.id);
      if (err) throw err;
      setProvider((prev) => (prev ? { ...prev, is_online: !prev.is_online } : prev));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTogglingOnline(false);
    }
  };

  const updateLocation = () => {
    if (!provider) return;
    setLocating(true);
    setLocationMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { error: err } = await supabase
            .from('service_providers')
            .update({ latitude, longitude, updated_at: new Date().toISOString() })
            .eq('id', provider.id);
          if (err) throw err;
          setProvider((prev) => (prev ? { ...prev, latitude, longitude } : prev));
          setLocationMsg(`Location updated: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch (e: any) {
          setLocationMsg('Failed to save location: ' + e.message);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocationMsg('GPS error: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const updateRequestStatus = async (reqId: string, newStatus: string) => {
    try {
      const { error: err } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reqId);
      if (err) throw err;
      setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="ml-3 text-muted-foreground">Loading provider dashboard...</span>
        </div>
      </main>
    );
  }

  if (error && !provider) {
    return (
      <main className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
        <div className="card p-8 text-center max-w-md mx-auto">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-card-foreground mb-2">
            Provider Profile Not Found
          </h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Make sure your account is linked to a service provider profile.
          </p>
        </div>
      </main>
    );
  }

  const completedRequests = requests.filter((r) => r.status === 'completed');
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.total_kes || 0), 0);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: `Requests (${requests.length})` },
    { key: 'nearby', label: 'Nearby Providers' },
    { key: 'location', label: 'My Location' },
  ] as const;

  return (
    <main className="max-w-screen-xl mx-auto px-4 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: '#1a2744' }}
          >
            {provider?.provider_type === 'towing' ? (
              <Truck size={28} className="text-white" />
            ) : (
              <Wrench size={28} className="text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">{provider?.business_name}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {provider?.provider_type} · {provider?.county}
            </p>
          </div>
        </div>
        <button
          onClick={toggleOnline}
          disabled={togglingOnline}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            provider?.is_online
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {provider?.is_online ? <Wifi size={16} /> : <WifiOff size={16} />}
          {togglingOnline ? 'Updating...' : provider?.is_online ? 'Online' : 'Offline'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Requests',
            value: requests.length,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Completed',
            value: completedRequests.length,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Pending',
            value: pendingRequests.length,
            icon: AlertCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Total Earned (KES)',
            value: totalEarnings.toLocaleString(),
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 text-center">
            <div
              className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}
            >
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className={`text-2xl font-extrabold font-tabular ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:text-card-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && provider && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-card-foreground mb-4">Provider Details</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Type', value: provider.provider_type },
                { label: 'County', value: provider.county },
                { label: 'Sub-County', value: provider.sub_county || '—' },
                { label: 'Rating', value: `${provider.rating.toFixed(1)} ★` },
                { label: 'Service Radius', value: `${provider.service_radius_km} km` },
                { label: 'Base Fee', value: `KES ${provider.base_fee_kes.toLocaleString()}` },
                { label: 'Per KM Fee', value: `KES ${provider.per_km_fee_kes.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-card-foreground capitalize">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="card p-6">
            <h2 className="text-base font-bold text-card-foreground mb-4">Contact Info</h2>
            <div className="space-y-3">
              <a
                href={`tel:${provider.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              >
                <Phone size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-card-foreground">{provider.phone}</span>
              </a>
              <a
                href={`https://wa.me/${provider.whatsapp_number?.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <MessageCircle size={18} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {provider.whatsapp_number}
                </span>
              </a>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
                <MapPin size={18} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {provider.latitude
                    ? `${provider.latitude.toFixed(5)}, ${provider.longitude.toFixed(5)}`
                    : 'Location not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Requests */}
      {activeTab === 'requests' && (
        <div className="card overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No service requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {['Type', 'Vehicle', 'Pickup', 'Distance', 'Fee (KES)', 'Status', 'Action'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground capitalize">
                        {req.request_type}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.vehicle_type} · {req.vehicle_plate}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate">
                        {req.pickup_address}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {req.distance_km ? `${req.distance_km.toFixed(1)} km` : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-card-foreground">
                        {req.total_kes ? req.total_kes.toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[req.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateRequestStatus(req.id, 'accepted')}
                              className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req.id, 'cancelled')}
                              className="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'on_way')}
                            className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-200 transition-colors"
                          >
                            On Way
                          </button>
                        )}
                        {req.status === 'on_way' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'completed')}
                            className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Nearby Providers */}
      {activeTab === 'nearby' && (
        <div>
          {nearbyProviders.length === 0 ? (
            <div className="card p-12 text-center">
              <Navigation size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No nearby providers found in your service radius.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Make sure your location is set and you are online.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyProviders.map((np) => (
                <div key={np.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-card-foreground">{np.business_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {np.provider_type} · {np.county}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${np.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {np.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={13} />
                      <span>{np.distance_km.toFixed(1)} km away</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Star size={13} />
                      <span className="font-medium">{np.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Location */}
      {activeTab === 'location' && provider && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-base font-bold text-card-foreground mb-2">Update My Location</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Keep your GPS location current so clients can find you. The system uses PostGIS to
            calculate real distances and rank you in nearest-provider searches.
          </p>
          <div className="p-4 rounded-xl bg-muted mb-6">
            <p className="text-xs text-muted-foreground mb-1">Current Location</p>
            {provider.latitude ? (
              <p className="text-sm font-mono font-medium text-card-foreground">
                {provider.latitude.toFixed(6)}, {provider.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not set</p>
            )}
          </div>
          <button
            onClick={updateLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: '#1a2744' }}
          >
            <Navigation size={16} />
            {locating ? 'Detecting GPS...' : 'Update My Location'}
          </button>
          {locationMsg && (
            <p
              className={`mt-3 text-sm text-center ${locationMsg.startsWith('Failed') || locationMsg.startsWith('GPS') ? 'text-red-600' : 'text-green-600'}`}
            >
              {locationMsg}
            </p>
          )}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-800 font-medium mb-1">How geo-ranking works</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Clients in your county see you first (county priority)</li>
              <li>Sorted by real GPS distance using PostGIS ST_Distance</li>
              <li>Only shown within your service radius ({provider.service_radius_km} km)</li>
              <li>
                Fee = KES {provider.base_fee_kes} base + {provider.per_km_fee_kes}/km
              </li>
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, MapPin, Star, Loader2, ArrowLeft } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import LocationCalibration from '@/components/LocationCalibration';
import { getAuthUser } from '@/lib/authStore';
import {
  registerRider,
  saveRiderProfile,
  getRiderProfile,
  updateRiderAvailability,
  type DeliveryRider,
} from '@/lib/deliveryStore';

const BIKE_TYPES = [
  {
    value: 'motorcycle',
    label: 'Motorcycle / Boda Boda',
    icon: '🏍️',
    desc: 'Fast delivery, up to 20kg',
  },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲', desc: 'Eco-friendly, short distances' },
  {
    value: 'cargo_bike',
    label: 'Cargo Bike / Mkokoteni',
    icon: '🛺',
    desc: 'Heavy loads, bulk orders',
  },
] as const;

const NAIROBI_AREAS = [
  'Nairobi CBD',
  'Westlands',
  'Kasarani',
  'Eastleigh',
  'South C',
  'Langata',
  'Karen',
  'Kilimani',
  'Lavington',
  'Parklands',
  'Gigiri',
  'Runda',
  'Ruaka',
  'Kiambu',
  'Thika',
  'Mombasa',
  'Kisumu',
  'Nakuru',
];

export default function BikeDeliveryPage() {
  const router = useRouter();
  const user = getAuthUser();
  const [existingProfile, setExistingProfile] = useState<DeliveryRider | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'profile'>('register');

  // Form state
  const [bikeType, setBikeType] = useState<'motorcycle' | 'bicycle' | 'cargo_bike'>('motorcycle');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState('100');
  const [pricePerKm, setPricePerKm] = useState('50');
  const [riderLat, setRiderLat] = useState<number | undefined>(user?.location_lat);
  const [riderLng, setRiderLng] = useState<number | undefined>(user?.location_lng);
  const [riderCity, setRiderCity] = useState(user?.city || '');
  const [error, setError] = useState('');

  useEffect(() => {
    const profile = getRiderProfile();
    if (profile) {
      setExistingProfile(profile);
      setIsRegistered(true);
      setActiveTab('profile');
    }
  }, []);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleLocationSaved = (lat: number, lng: number, city: string) => {
    setRiderLat(lat);
    setRiderLng(lng);
    setRiderCity(city);
    if (city && !selectedAreas.includes(city)) {
      setSelectedAreas((prev) => [...prev, city]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push('/');
      return;
    }
    if (selectedAreas.length === 0) {
      setError('Please select at least one service area.');
      return;
    }
    if (!riderLat || !riderLng) {
      setError('Please detect your GPS location first.');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const rider = registerRider({
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone || '',
      email: user.email,
      bikeType,
      serviceAreas: selectedAreas,
      pricePerKm: parseInt(pricePerKm) || 50,
      basePrice: parseInt(basePrice) || 100,
      isAvailable: true,
      location_lat: riderLat,
      location_lng: riderLng,
      city: riderCity,
    });

    saveRiderProfile(rider);
    setExistingProfile(rider);
    setIsRegistered(true);
    setActiveTab('profile');
    setIsLoading(false);
  };

  const handleToggleAvailability = () => {
    if (!existingProfile) return;
    const newStatus = !existingProfile.isAvailable;
    updateRiderAvailability(existingProfile.id, newStatus);
    setExistingProfile((prev) => (prev ? { ...prev, isAvailable: newStatus } : null));
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Bike size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Bike Delivery Service</h1>
            <p className="text-sm text-muted-foreground">
              Register as a delivery rider and earn per delivery
            </p>
          </div>
        </div>

        {/* Tabs */}
        {isRegistered && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              My Rider Profile
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Update Registration
            </button>
          </div>
        )}

        {/* Profile view */}
        {activeTab === 'profile' && existingProfile && (
          <div className="space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-card-foreground">{existingProfile.name}</h2>
                  <p className="text-sm text-muted-foreground">{existingProfile.phone}</p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    existingProfile.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {existingProfile.isAvailable ? '🟢 Available' : '⚫ Offline'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Bike Type</p>
                  <p className="text-sm font-semibold text-card-foreground capitalize">
                    {BIKE_TYPES.find((b) => b.value === existingProfile.bikeType)?.icon}{' '}
                    {existingProfile.bikeType.replace('_', ' ')}
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Base Fee</p>
                  <p className="text-sm font-semibold text-card-foreground">
                    KES {existingProfile.basePrice} + {existingProfile.pricePerKm}/km
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <p className="text-sm font-semibold text-card-foreground flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    {existingProfile.rating.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">Deliveries</p>
                  <p className="text-sm font-semibold text-card-foreground">
                    {existingProfile.totalDeliveries}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Service Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {existingProfile.serviceAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2.5 py-1 rounded-full bg-accent text-primary text-xs font-semibold"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {existingProfile.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin size={14} className="text-primary" />
                  <span>Based in {existingProfile.city}</span>
                </div>
              )}

              <button
                onClick={handleToggleAvailability}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                  existingProfile.isAvailable
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {existingProfile.isAvailable ? 'Go Offline' : 'Go Online — Accept Deliveries'}
              </button>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-bold text-card-foreground mb-3">Update Your Location</h3>
              <LocationCalibration
                onLocationSaved={(lat, lng, city) => {
                  setExistingProfile((prev) =>
                    prev ? { ...prev, location_lat: lat, location_lng: lng, city } : null
                  );
                }}
                currentLat={existingProfile.location_lat}
                currentLng={existingProfile.location_lng}
                currentCity={existingProfile.city}
              />
            </div>
          </div>
        )}

        {/* Registration form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Bike type */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide">
                Bike Type
              </h2>
              <div className="space-y-2">
                {BIKE_TYPES.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setBikeType(bt.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      bikeType === bt.value
                        ? 'border-primary bg-accent/40'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-2xl">{bt.icon}</span>
                    <div>
                      <p
                        className={`text-sm font-semibold ${bikeType === bt.value ? 'text-primary' : 'text-card-foreground'}`}
                      >
                        {bt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{bt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide">
                Your Delivery Pricing (KES)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Base Fee (flat)
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Charged per order</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Per Km Rate
                  </label>
                  <input
                    type="number"
                    value={pricePerKm}
                    onChange={(e) => setPricePerKm(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">KES per km travelled</p>
                </div>
              </div>
              <div className="mt-3 px-4 py-3 rounded-xl bg-accent/40 border border-primary/20">
                <p className="text-xs text-primary font-semibold">
                  Example: 5km delivery = KES{' '}
                  {parseInt(basePrice || '100') + parseInt(pricePerKm || '50') * 5}
                </p>
              </div>
            </div>

            {/* Service areas */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide">
                Service Areas{' '}
                <span className="text-muted-foreground font-normal normal-case">
                  (select all you cover)
                </span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {NAIROBI_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedAreas.includes(area)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {selectedAreas.length > 0 && (
                <p className="text-xs text-primary font-medium mt-2">
                  {selectedAreas.length} area{selectedAreas.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* GPS Location */}
            <div className="card p-5">
              <h2 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide">
                Your Current Location
              </h2>
              <LocationCalibration
                onLocationSaved={handleLocationSaved}
                currentLat={riderLat}
                currentLng={riderLng}
                currentCity={riderCity}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-base justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Bike size={20} />
                  {isRegistered ? 'Update Registration' : 'Register as Delivery Rider'}
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

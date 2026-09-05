'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import ProductGrid from './ProductGrid';
import ProductDetailModal from './ProductDetailModal';
import FilterBar from './FilterBar';
import LocationCalibration from '@/components/LocationCalibration';
import { getAuthUser } from '@/lib/authStore';
import { getAvailableItems, getAvailableItemsAsync } from '@/lib/vendorItemsStore';
import { haversineDistance } from '@/lib/mockData';

import type { VendorItem } from '@/lib/mockData';
import { MapPin, AlertCircle, Navigation } from 'lucide-react';

interface ItemWithDistance extends VendorItem {
  distance?: number;
}

function ClientHomeInner() {
  const [allItems, setAllItems] = useState<ItemWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ItemWithDistance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>(undefined);
  const [userLng, setUserLng] = useState<number | undefined>(undefined);
  const [userCity, setUserCity] = useState<string | undefined>(undefined);
  const { showToast } = useToast();

  const user = getAuthUser();

  // Load user location from auth store on mount
  useEffect(() => {
    const u = getAuthUser();
    if (u?.location_lat && u?.location_lng) {
      setUserLat(u.location_lat);
      setUserLng(u.location_lng);
      setUserCity(u.city);
      setHasLocation(true);
    }
  }, []);

  const loadAndSortItems = useCallback(
    async (lat?: number, lng?: number) => {
      setIsLoading(true);
      try {
        const items = await getAvailableItemsAsync();
        const lat_ = lat ?? userLat;
        const lng_ = lng ?? userLng;

        let sorted: ItemWithDistance[];

        if (lat_ && lng_) {
          sorted = items
            .map((item) => ({
              ...item,
              distance: haversineDistance(lat_, lng_, item.location_lat, item.location_lng),
            }))
            .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
          setHasLocation(true);
        } else {
          sorted = [...items].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setHasLocation(false);
        }

        setAllItems(sorted);
      } catch {
        // Fallback to sync
        const items = getAvailableItems();
        setAllItems(items);
      } finally {
        setIsLoading(false);
      }
    },
    [userLat, userLng]
  );

  useEffect(() => {
    loadAndSortItems();
  }, [loadAndSortItems]);

  useEffect(() => {
    const refreshItems = () => {
      loadAndSortItems(userLat, userLng);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshItems();
      }
    };

    window.addEventListener('focus', refreshItems);
    window.addEventListener('storage', refreshItems);
    // listen for in-tab updates triggered when vendor items are saved to localStorage
    window.addEventListener('vendor-items-updated', refreshItems);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', refreshItems);
      window.removeEventListener('storage', refreshItems);
      window.removeEventListener('vendor-items-updated', refreshItems);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadAndSortItems, userLat, userLng]);

  // Auto-detect location on first visit if not already set
  useEffect(() => {
    const u = getAuthUser();
    if (!u?.location_lat && typeof window !== 'undefined' && navigator.geolocation) {
      // Show location panel prompt after a short delay
      const timer = setTimeout(() => setShowLocationPanel(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLocationSaved = useCallback(
    (lat: number, lng: number, city: string) => {
      setUserLat(lat);
      setUserLng(lng);
      setUserCity(city);
      setHasLocation(true);
      setShowLocationPanel(false);
      loadAndSortItems(lat, lng);
      showToast(
        `📍 Location set to ${city || 'your area'} — showing nearest vendors first!`,
        'success'
      );
    },
    [loadAndSortItems, showToast]
  );

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchQuery, selectedCategory]);

  // Split into near/other
  const nearItems = filteredItems.filter((i) => i.distance !== undefined && i.distance <= 5);
  const otherItems = filteredItems.filter((i) => i.distance === undefined || i.distance > 5);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allItems.map((i) => i.category)));
    return cats.sort();
  }, [allItems]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 py-6">
        {/* Hero greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground">
            {user?.first_name ? `Hello, ${user.first_name} 👋` : 'Discover nearby products'}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {hasLocation ? (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <MapPin size={14} />
                <span className="font-medium">
                  {userCity || user?.city || 'Your location'} — showing nearest first
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-amber-600">
                <AlertCircle size={14} />
                <span className="font-medium">Enable location to see products near you</span>
              </div>
            )}
            <button
              onClick={() => setShowLocationPanel((v) => !v)}
              className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
            >
              <Navigation size={12} />
              {hasLocation ? 'Update location' : 'Detect location'}
            </button>
          </div>
        </div>

        {/* Location calibration panel */}
        {showLocationPanel && (
          <div className="mb-5 max-w-md">
            <LocationCalibration
              onLocationSaved={handleLocationSaved}
              currentLat={userLat}
              currentLng={userLng}
              currentCity={userCity}
            />
          </div>
        )}

        {/* Location denied banner */}
        {locationDenied && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              Location access was denied. Showing all products — allow location in browser settings
              for geo-ranked results.
            </p>
            <button
              onClick={() => setLocationDenied(false)}
              className="text-amber-600 hover:text-amber-800 font-semibold text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          totalCount={filteredItems.length}
          isLoading={isLoading}
        />

        {/* Content */}
        {hasLocation && !isLoading && (nearItems.length > 0 || otherItems.length > 0) ? (
          <div className="space-y-8">
            {/* Near You */}
            {nearItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    <h2 className="text-lg font-bold text-card-foreground">Near You</h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    Within 5 km
                  </span>
                </div>
                <ProductGrid items={nearItems} onSelect={setSelectedItem} isLoading={false} />
              </section>
            )}

            {/* Other Areas */}
            {otherItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-card-foreground">Other Areas</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                    {otherItems.length} product{otherItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ProductGrid items={otherItems} onSelect={setSelectedItem} isLoading={false} />
              </section>
            )}
          </div>
        ) : (
          <ProductGrid
            items={filteredItems}
            onSelect={setSelectedItem}
            isLoading={isLoading}
            emptyMessage={
              searchQuery || selectedCategory
                ? 'No products match your search. Try a different category or keyword.'
                : 'No products available yet. Check back soon!'
            }
          />
        )}
      </main>

      {/* Product detail modal */}
      {selectedItem && (
        <ProductDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default function ClientHomeClient() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="client">
        <ClientHomeInner />
      </RoleGuard>
    </ToastProvider>
  );
}

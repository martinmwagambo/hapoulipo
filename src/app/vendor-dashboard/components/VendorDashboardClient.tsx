'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import AddProductForm from './AddProductForm';
import ProductWall from './ProductWall';
import EditProductModal from './EditProductModal';
import { getAuthUser } from '@/lib/authStore';
import {
  getVendorItems,
  getVendorItemsAsync,
  deleteItemAsync,
  toggleAvailabilityAsync,
} from '@/lib/vendorItemsStore';
import type { VendorItem } from '@/lib/mockData';
import { Package, Plus, LayoutGrid, MapPin } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import LocationCalibration from '@/components/LocationCalibration';

function VendorDashboardInner() {
  const [activeTab, setActiveTab] = useState<'add' | 'wall' | 'location'>('wall');
  const [items, setItems] = useState<VendorItem[]>([]);
  const [editItem, setEditItem] = useState<VendorItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getAuthUser> | null>(null);
  const { showToast } = useToast();

  const loadItems = useCallback(async () => {
    if (user?.id) {
      try {
        const loaded = await getVendorItemsAsync(user.id);
        setItems(loaded);
      } catch {
        setItems(getVendorItems(user.id));
      }
    }
  }, [user?.id]);

  useEffect(() => {
    setUser(getAuthUser());
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const handleStorageUpdate = () => loadItems();
    window.addEventListener('vendor-items-updated', handleStorageUpdate);
    return () => window.removeEventListener('vendor-items-updated', handleStorageUpdate);
  }, [loadItems]);

  const handleProductAdded = async (item: VendorItem) => {
    setItems((prev) => [item, ...prev]);
    await loadItems();
    setActiveTab('wall');
    showToast('Product added to your Wall', 'success');
  };

  const handleToggleAvailability = async (id: string) => {
    await toggleAvailabilityAsync(id);
    await loadItems();
    const item = items.find((i) => i.id === id);
    const newStatus = !item?.is_available;
    showToast(`Product marked as ${newStatus ? 'available' : 'unavailable'}`, 'info');
  };

  const handleEditSaved = () => {
    loadItems();
    setEditItem(null);
    showToast('Product updated successfully', 'success');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    await deleteItemAsync(deleteTarget.id);
    await loadItems();
    setDeleteTarget(null);
    setIsDeleting(false);
    showToast(`"${deleteTarget.item_name}" removed from your Wall`, 'success');
  };

  const handleLocationSaved = (lat: number, lng: number, city: string) => {
    setUser((prev) => (prev ? { ...prev, location_lat: lat, location_lng: lng, city } : prev));
    showToast(
      `📍 Location updated to ${city || 'your area'} — clients will now find you first!`,
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground">Vendor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product wall — {items.length} product{items.length !== 1 ? 's' : ''} listed
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Products', value: items.length, color: 'text-card-foreground' },
            {
              label: 'Available Now',
              value: items.filter((i) => i.is_available).length,
              color: 'text-green-600',
            },
            {
              label: 'Unavailable',
              value: items.filter((i) => !i.is_available).length,
              color: 'text-amber-600',
            },
            {
              label: 'Categories',
              value: new Set(items.map((i) => i.category)).size,
              color: 'text-blue-600',
            },
          ].map((stat) => (
            <div key={`stat-${stat.label}`} className="card px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className={`text-2xl font-extrabold font-tabular ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('wall')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'wall'
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <LayoutGrid size={16} />
            My Wall
            {items.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'wall' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}
              >
                {items.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'add'
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Plus size={16} />
            Add Product
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
              activeTab === 'location'
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <MapPin size={16} />
            My Location
            {!user?.location_lat && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'add' ? (
          <div className="max-w-2xl">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Package size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-card-foreground">Add New Product</h2>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details to list on your Wall
                  </p>
                </div>
              </div>
              <AddProductForm
                onSuccess={handleProductAdded}
                vendorId={user?.id ?? ''}
                vendorCity={user?.city ?? ''}
                vendorLat={user?.location_lat ?? 0}
                vendorLng={user?.location_lng ?? 0}
              />
            </div>
          </div>
        ) : activeTab === 'location' ? (
          <div className="max-w-md">
            <div className="card p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">Calibrate Your Location</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your GPS location helps clients find you first. Products you list will inherit
                  your location.
                </p>
              </div>
              {user?.location_lat && user?.location_lng && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
                  <MapPin size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Current: {user.city || 'Location saved'}
                    </p>
                    <p className="text-xs text-green-600">
                      Lat: {user.location_lat.toFixed(5)}, Lng: {user.location_lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              )}
              <LocationCalibration
                onLocationSaved={handleLocationSaved}
                currentLat={user?.location_lat}
                currentLng={user?.location_lng}
                currentCity={user?.city}
              />
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <p className="text-xs text-blue-700 font-medium">💡 Tip</p>
                <p className="text-xs text-blue-600 mt-1">
                  After updating your location, new products you add will automatically use your
                  current GPS coordinates. Clients nearby will see your products first.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ProductWall
            items={items}
            onToggleAvailability={handleToggleAvailability}
            onEdit={setEditItem}
            onDelete={setDeleteTarget}
            onAddFirst={() => setActiveTab('add')}
          />
        )}
      </main>

      {/* Edit Modal */}
      {editItem && (
        <EditProductModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Product"
        message={`Are you sure you want to remove "${deleteTarget?.item_name}" from your Wall? This cannot be undone.`}
        confirmLabel="Remove Product"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function VendorDashboardClient() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="vendor">
        <VendorDashboardInner />
      </RoleGuard>
    </ToastProvider>
  );
}

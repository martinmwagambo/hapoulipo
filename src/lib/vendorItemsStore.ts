// Vendor Items Store — Supabase-backed with localStorage fallback
import { createClient } from '@/lib/supabase/client';
import { VendorItem, mockVendorItems } from './mockData';

const STORE_KEY = 'hapo_vendor_items';

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function loadFromStorage(): VendorItem[] {
  if (typeof window === 'undefined') return [...mockVendorItems];
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initialItems = [...mockVendorItems];
      localStorage.setItem(STORE_KEY, JSON.stringify(initialItems));
      return initialItems;
    }
    return JSON.parse(raw) as VendorItem[];
  } catch {
    return [...mockVendorItems];
  }
}

function saveToStorage(items: VendorItem[]): void {
  if (typeof window === 'undefined') return;
  const safeItems = Array.isArray(items) ? [...items] : [];
  localStorage.setItem(STORE_KEY, JSON.stringify(safeItems));
  try {
    window.dispatchEvent(new Event('vendor-items-updated'));
  } catch {
    // ignore
  }
}

// Map Supabase row → VendorItem
function mapRow(row: any): VendorItem {
  return {
    id: row.id,
    vendor_id: row.vendor_id,
    item_name: row.item_name,
    description: row.description || '',
    price_kes: row.price_kes,
    category: row.category,
    images: row.images || [],
    is_available: row.is_available,
    city: row.city || '',
    location_lat: row.location_lat || 0,
    location_lng: row.location_lng || 0,
    created_at: row.created_at,
    vendor_name: row.vendor_profiles?.first_name
      ? `${row.vendor_profiles.first_name} ${row.vendor_profiles.last_name}`
      : undefined,
    vendor_whatsapp: row.vendor_profiles?.whatsapp_number || undefined,
  };
}

function mergeItems(remote: VendorItem[], local: VendorItem[]): VendorItem[] {
  const combined = new Map<string, VendorItem>();
  remote.forEach((item) => combined.set(item.id, item));
  local.forEach((item) => {
    if (!combined.has(item.id)) {
      combined.set(item.id, item);
    }
  });
  return Array.from(combined.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getAllItemsAsync(): Promise<VendorItem[]> {
  const supabase = getSupabase();
  if (!supabase) return loadFromStorage();
  try {
    const { data, error } = await supabase
      .from('vendor_items')
      .select('*, vendor_profiles:vendor_id(first_name, last_name, whatsapp_number)')
      .order('created_at', { ascending: false });
    if (error || !data) {
      return loadFromStorage();
    }
    const items = data.map(mapRow);
    const merged = mergeItems(items, loadFromStorage());
    saveToStorage(merged);
    return merged;
  } catch {
    return loadFromStorage();
  }
}

export async function getAvailableItemsAsync(): Promise<VendorItem[]> {
  const supabase = getSupabase();
  if (!supabase) return loadFromStorage().filter((i) => i.is_available);
  try {
    const { data, error } = await supabase
      .from('vendor_items')
      .select('*, vendor_profiles:vendor_id(first_name, last_name, whatsapp_number)')
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    if (error || !data) {
      return loadFromStorage().filter((i) => i.is_available);
    }
    const remoteItems = data.map(mapRow);
    const merged = mergeItems(remoteItems, loadFromStorage()).filter((i) => i.is_available);
    return merged;
  } catch {
    return loadFromStorage().filter((i) => i.is_available);
  }
}

export async function getVendorItemsAsync(vendorId: string): Promise<VendorItem[]> {
  const supabase = getSupabase();
  if (!supabase) return loadFromStorage().filter((i) => i.vendor_id === vendorId);
  try {
    const { data, error } = await supabase
      .from('vendor_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (error || !data) {
      return loadFromStorage().filter((i) => i.vendor_id === vendorId);
    }
    const remoteItems = data.map(mapRow);
    const merged = mergeItems(remoteItems, loadFromStorage()).filter(
      (i) => i.vendor_id === vendorId
    );
    return merged;
  } catch {
    return loadFromStorage().filter((i) => i.vendor_id === vendorId);
  }
}

export async function addItemAsync(item: VendorItem): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('vendor_items').insert({
        id: item.id,
        vendor_id: item.vendor_id,
        item_name: item.item_name,
        description: item.description,
        price_kes: item.price_kes,
        category: item.category,
        images: item.images,
        is_available: item.is_available,
        city: item.city,
        location_lat: item.location_lat,
        location_lng: item.location_lng,
      });
      if (error) console.warn('addItem Supabase error:', error.message);
    } catch (e) {
      console.warn('addItem error:', e);
    }
  }
  // Also update localStorage
  const items = loadFromStorage();
  items.unshift(item);
  saveToStorage(items);
}

export async function updateItemAsync(id: string, updates: Partial<VendorItem>): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.item_name !== undefined) dbUpdates.item_name = updates.item_name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.price_kes !== undefined) dbUpdates.price_kes = updates.price_kes;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.is_available !== undefined) dbUpdates.is_available = updates.is_available;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.location_lat !== undefined) dbUpdates.location_lat = updates.location_lat;
      if (updates.location_lng !== undefined) dbUpdates.location_lng = updates.location_lng;
      const { error } = await supabase.from('vendor_items').update(dbUpdates).eq('id', id);
      if (error) console.warn('updateItem Supabase error:', error.message);
    } catch (e) {
      console.warn('updateItem error:', e);
    }
  }
  const items = loadFromStorage();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    saveToStorage(items);
  }
}

export async function deleteItemAsync(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('vendor_items').delete().eq('id', id);
      if (error) console.warn('deleteItem Supabase error:', error.message);
    } catch (e) {
      console.warn('deleteItem error:', e);
    }
  }
  saveToStorage(loadFromStorage().filter((i) => i.id !== id));
}

export async function toggleAvailabilityAsync(id: string): Promise<void> {
  const items = loadFromStorage();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    const newVal = !items[idx].is_available;
    await updateItemAsync(id, { is_available: newVal });
  }
}

// Sync wrappers for backward compatibility
export function getAllItems(): VendorItem[] {
  return loadFromStorage();
}
export function getVendorItems(vendorId: string): VendorItem[] {
  return loadFromStorage().filter((i) => i.vendor_id === vendorId);
}
export function getAvailableItems(): VendorItem[] {
  return loadFromStorage().filter((i) => i.is_available);
}
export function addItem(item: VendorItem): void {
  addItemAsync(item);
}
export function updateItem(id: string, updates: Partial<VendorItem>): void {
  updateItemAsync(id, updates);
}
export function deleteItem(id: string): void {
  deleteItemAsync(id);
}
export function toggleAvailability(id: string): void {
  toggleAvailabilityAsync(id);
}

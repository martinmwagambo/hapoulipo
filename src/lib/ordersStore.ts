// Orders Store — Supabase-backed with localStorage fallback
import { createClient } from '@/lib/supabase/client';

export type VendorOrderStatus = 'pending' | 'shipped' | 'delivered';

export interface VendorOrder {
  orderId: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  itemPrice: number;
  quantity: number;
  totalAmount: number;
  vendorId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  deliveryAddress: string;
  status: VendorOrderStatus;
  paymentMethod: 'mpesa' | 'bank';
  vendorPayout: number;
  shippingNote?: string;
  createdAt: string;
  updatedAt: string;
}

const VENDOR_ORDERS_KEY = 'hapo_vendor_orders';
const CLIENT_ORDERS_KEY = 'hapo_client_orders';

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function mapOrderRow(row: any): VendorOrder {
  return {
    orderId: row.id,
    itemId: row.item_id || '',
    itemName: row.item_name,
    itemImage: row.item_image || '',
    itemPrice: row.item_price,
    quantity: row.quantity,
    totalAmount: row.total_amount,
    vendorId: row.vendor_id,
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email,
    deliveryAddress: row.delivery_address,
    status: row.status as VendorOrderStatus,
    paymentMethod: row.payment_method as 'mpesa' | 'bank',
    vendorPayout: row.vendor_payout,
    shippingNote: row.shipping_note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Mock seed orders for demo (used as fallback)
const MOCK_ORDERS: VendorOrder[] = [
  {
    orderId: 'ORD-MOCK-001',
    itemId: 'item-001',
    itemName: 'Fresh Pilipili Hoho (Bell Peppers)',
    itemImage: 'https://images.unsplash.com/photo-1723110569384-800b1641c8a3',
    itemPrice: 120,
    quantity: 3,
    totalAmount: 360,
    vendorId: 'user-002',
    buyerName: 'Amina Wanjiku',
    buyerPhone: '+254712345678',
    buyerEmail: 'amina@hapo.co.ke',
    deliveryAddress: 'Westlands, Nairobi',
    status: 'pending',
    paymentMethod: 'mpesa',
    vendorPayout: 306,
    createdAt: '2026-07-28T08:30:00Z',
    updatedAt: '2026-07-28T08:30:00Z',
  },
  {
    orderId: 'ORD-MOCK-002',
    itemId: 'item-002',
    itemName: 'Unga wa Ngano 2kg',
    itemImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_1dce9e4f4-1775813022863.png',
    itemPrice: 195,
    quantity: 2,
    totalAmount: 390,
    vendorId: 'user-002',
    buyerName: 'Brian Kamau',
    buyerPhone: '+254745678901',
    buyerEmail: 'brian@example.com',
    deliveryAddress: 'Kasarani, Nairobi',
    status: 'shipped',
    paymentMethod: 'mpesa',
    vendorPayout: 331,
    shippingNote: 'Dispatched via boda boda. ETA 30 mins.',
    createdAt: '2026-07-27T14:00:00Z',
    updatedAt: '2026-07-27T15:20:00Z',
  },
  {
    orderId: 'ORD-MOCK-003',
    itemId: 'item-001',
    itemName: 'Fresh Pilipili Hoho (Bell Peppers)',
    itemImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_1a2d7787b-1768142383305.png',
    itemPrice: 120,
    quantity: 5,
    totalAmount: 600,
    vendorId: 'user-002',
    buyerName: 'Fatuma Hassan',
    buyerPhone: '+254756789012',
    buyerEmail: 'fatuma@example.com',
    deliveryAddress: 'South C, Nairobi',
    status: 'delivered',
    paymentMethod: 'bank',
    vendorPayout: 510,
    shippingNote: 'Delivered and confirmed by buyer.',
    createdAt: '2026-07-26T10:00:00Z',
    updatedAt: '2026-07-26T13:45:00Z',
  },
];

const MOCK_CLIENT_ORDERS: VendorOrder[] = [
  {
    orderId: 'ORD-CLI-001',
    itemId: 'item-003',
    itemName: 'Sukuma Wiki (Kale) — 1kg Bundle',
    itemImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_1b30767f8-1769355467484.png',
    itemPrice: 80,
    quantity: 2,
    totalAmount: 160,
    vendorId: 'vendor-001',
    buyerName: 'You',
    buyerPhone: '+254700000001',
    buyerEmail: 'client@hapo.co.ke',
    deliveryAddress: 'Kilimani, Nairobi',
    status: 'delivered',
    paymentMethod: 'mpesa',
    vendorPayout: 136,
    shippingNote: 'Delivered to gate. Confirmed by security.',
    createdAt: '2026-07-25T09:00:00Z',
    updatedAt: '2026-07-25T12:30:00Z',
  },
  {
    orderId: 'ORD-CLI-002',
    itemId: 'item-002',
    itemName: 'Unga wa Ngano 2kg',
    itemImage: 'https://img.rocket.new/generatedImages/rocket_gen_img_1dce9e4f4-1775813022863.png',
    itemPrice: 195,
    quantity: 1,
    totalAmount: 195,
    vendorId: 'vendor-002',
    buyerName: 'You',
    buyerPhone: '+254700000001',
    buyerEmail: 'client@hapo.co.ke',
    deliveryAddress: 'Kilimani, Nairobi',
    status: 'shipped',
    paymentMethod: 'mpesa',
    vendorPayout: 165,
    shippingNote: 'Dispatched via boda boda. ETA 45 mins.',
    createdAt: '2026-07-27T11:00:00Z',
    updatedAt: '2026-07-27T13:00:00Z',
  },
];

export async function getVendorOrdersAsync(vendorId: string): Promise<VendorOrder[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('vendor_orders')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const orders = data.map(mapOrderRow);
        try {
          localStorage.setItem(VENDOR_ORDERS_KEY, JSON.stringify(orders));
        } catch {}
        return orders;
      }
    } catch (e) {
      console.warn('getVendorOrders Supabase error:', e);
    }
  }
  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(VENDOR_ORDERS_KEY);
    if (raw) {
      const all: VendorOrder[] = JSON.parse(raw);
      return all
        .filter((o) => o.vendorId === vendorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {}
  return MOCK_ORDERS.filter((o) => o.vendorId === vendorId);
}

export async function getClientOrdersAsync(buyerEmail: string): Promise<VendorOrder[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('vendor_orders')
          .select('*')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const orders = data.map(mapOrderRow);
          try {
            localStorage.setItem(CLIENT_ORDERS_KEY, JSON.stringify(orders));
          } catch {}
          return orders;
        }
      }
    } catch (e) {
      console.warn('getClientOrders Supabase error:', e);
    }
  }
  // Fallback
  try {
    const raw = localStorage.getItem(CLIENT_ORDERS_KEY);
    if (raw) {
      const all: VendorOrder[] = JSON.parse(raw);
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {}
  return MOCK_CLIENT_ORDERS;
}

export async function updateOrderStatusAsync(
  orderId: string,
  status: VendorOrderStatus,
  shippingNote?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (shippingNote !== undefined) updates.shipping_note = shippingNote;
      const { error } = await supabase.from('vendor_orders').update(updates).eq('id', orderId);
      if (!error) return true;
      console.warn('updateOrderStatus Supabase error:', error.message);
    } catch (e) {
      console.warn('updateOrderStatus error:', e);
    }
  }
  // Fallback localStorage update
  try {
    const raw = localStorage.getItem(VENDOR_ORDERS_KEY);
    if (raw) {
      const orders: VendorOrder[] = JSON.parse(raw);
      const idx = orders.findIndex((o) => o.orderId === orderId);
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], status, updatedAt: new Date().toISOString() };
        if (shippingNote !== undefined) orders[idx].shippingNote = shippingNote;
        localStorage.setItem(VENDOR_ORDERS_KEY, JSON.stringify(orders));
        return true;
      }
    }
  } catch {}
  return false;
}

// Sync wrappers for backward compatibility
export function getVendorOrders(vendorId: string): VendorOrder[] {
  try {
    const raw = localStorage.getItem(VENDOR_ORDERS_KEY);
    if (raw) {
      const all: VendorOrder[] = JSON.parse(raw);
      return all
        .filter((o) => o.vendorId === vendorId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {}
  return MOCK_ORDERS.filter((o) => o.vendorId === vendorId);
}

export function getClientOrders(buyerEmail: string): VendorOrder[] {
  try {
    const raw = localStorage.getItem(CLIENT_ORDERS_KEY);
    if (raw)
      return JSON.parse(raw).sort(
        (a: VendorOrder, b: VendorOrder) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch {}
  return MOCK_CLIENT_ORDERS;
}

export function updateOrderStatus(
  orderId: string,
  status: VendorOrderStatus,
  shippingNote?: string
): boolean {
  updateOrderStatusAsync(orderId, status, shippingNote);
  return true;
}

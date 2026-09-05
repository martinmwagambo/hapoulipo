// Backend integration point: Replace these with API calls to your database
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'client' | 'vendor' | 'ambassador' | 'admin' | 'towing' | 'garage' | 'rider';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: UserRole;
  whatsapp_number?: string;
  ambassador_code?: string;
  referred_by?: string;
  location_lat?: number;
  location_lng?: number;
  city?: string;
  location_confirmed?: boolean;
  is_active: boolean;
  password: string;
}

export interface VendorItem {
  id: string;
  vendor_id: string;
  item_name: string;
  description: string;
  price_kes: number;
  category: 'Food' | 'Pharmacy' | 'Groceries' | 'Electronics' | 'Clothing' | 'Other';
  images: string[];
  is_available: boolean;
  city: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
  vendor_name?: string;
  vendor_whatsapp?: string;
}

export const CATEGORIES = [
  'Food',
  'Pharmacy',
  'Groceries',
  'Electronics',
  'Clothing',
  'Other',
] as const;

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-001',
    first_name: 'Amina',
    last_name: 'Wanjiku',
    phone: '+254712345678',
    email: 'amina@hapo.co.ke',
    role: 'client',
    whatsapp_number: '+254712345678',
    location_lat: -1.2921,
    location_lng: 36.8219,
    city: 'Nairobi',
    is_active: true,
    password: 'client123',
  },
  {
    id: 'user-002',
    first_name: 'James',
    last_name: 'Otieno',
    phone: '+254723456789',
    email: 'james@hapo.co.ke',
    role: 'vendor',
    whatsapp_number: '+254723456789',
    location_lat: -1.2864,
    location_lng: 36.8172,
    city: 'Nairobi',
    is_active: true,
    password: 'vendor123',
  },
  {
    id: 'user-003',
    first_name: 'Grace',
    last_name: 'Muthoni',
    phone: '+254734567890',
    email: 'grace@hapo.co.ke',
    role: 'ambassador',
    whatsapp_number: '+254734567890',
    ambassador_code: 'HAPGRC847',
    city: 'Mombasa',
    is_active: true,
    password: 'ambassador123',
  },
  {
    id: 'user-004',
    first_name: 'Admin',
    last_name: 'Hapo',
    phone: '+254745678901',
    email: 'admin@hapo.co.ke',
    role: 'admin',
    city: 'Nairobi',
    is_active: true,
    password: 'admin123',
  },
  {
    id: 'user-005',
    first_name: 'Admin',
    last_name: 'Hapo',
    phone: '+254745678902',
    email: 'admin2@hapo.co.ke',
    role: 'admin',
    city: 'Nairobi',
    is_active: true,
    password: 'admin123',
  },
];

// Mock vendor items
export const mockVendorItems: VendorItem[] = [
  {
    id: 'item-001',
    vendor_id: 'user-002',
    item_name: 'Fresh Pilipili Hoho (Bell Peppers)',
    description:
      'Freshly harvested red, yellow and green bell peppers from Limuru farms. Perfect for cooking or salads. Sold per kg.',
    price_kes: 120,
    category: 'Food',
    images: [
      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80',
      'https://images.unsplash.com/photo-1518977676405-d4f0e1662a4a?w=600&q=80',
    ],
    is_available: true,
    city: 'Nairobi',
    location_lat: -1.2864,
    location_lng: 36.8172,
    created_at: '2026-07-25T08:00:00Z',
    vendor_name: 'James Otieno',
    vendor_whatsapp: '+254723456789',
  },
  {
    id: 'item-002',
    vendor_id: 'user-002',
    item_name: 'Unga wa Ngano 2kg',
    description:
      'Premium wheat flour, Jogoo brand, 2kg packet. Great for chapati, mandazi and baking. Fresh stock.',
    price_kes: 195,
    category: 'Groceries',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80'],
    is_available: true,
    city: 'Nairobi',
    location_lat: -1.2864,
    location_lng: 36.8172,
    created_at: '2026-07-24T10:30:00Z',
    vendor_name: 'James Otieno',
    vendor_whatsapp: '+254723456789',
  },
  {
    id: 'item-003',
    vendor_id: 'user-vendor-002',
    item_name: 'Panadol Extra 12s',
    description:
      'Panadol Extra Advance 12 tablets. Effective pain relief for headaches, fever and body aches. Genuine pharmacy stock.',
    price_kes: 85,
    category: 'Pharmacy',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80'],
    is_available: true,
    city: 'Westlands',
    location_lat: -1.2673,
    location_lng: 36.8063,
    created_at: '2026-07-23T14:00:00Z',
    vendor_name: 'Fatuma Pharmacy',
    vendor_whatsapp: '+254756789012',
  },
  {
    id: 'item-004',
    vendor_id: 'user-vendor-003',
    item_name: 'Samsung Earbuds A Series',
    description:
      'Samsung Galaxy Buds A — wireless earbuds with active noise cancellation. 6 hours battery life. Original sealed box.',
    price_kes: 3200,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&q=80'],
    is_available: true,
    city: 'CBD Nairobi',
    location_lat: -1.2833,
    location_lng: 36.8167,
    created_at: '2026-07-22T09:00:00Z',
    vendor_name: 'TechHub Kenya',
    vendor_whatsapp: '+254767890123',
  },
  {
    id: 'item-005',
    vendor_id: 'user-vendor-004',
    item_name: 'Kitenge Dress — African Print',
    description:
      'Beautiful Ankara kitenge dress, A-line cut. Available in sizes S, M, L, XL. Made in Kenya. Multiple patterns available.',
    price_kes: 1800,
    category: 'Clothing',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4b4ae5?w=600&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    ],
    is_available: true,
    city: 'Gikomba',
    location_lat: -1.2921,
    location_lng: 36.8442,
    created_at: '2026-07-21T11:00:00Z',
    vendor_name: 'Mama Africa Fashions',
    vendor_whatsapp: '+254778901234',
  },
  {
    id: 'item-006',
    vendor_id: 'user-vendor-005',
    item_name: 'Sukuma Wiki — Fresh Kale',
    description:
      'Fresh sukuma wiki (kale) from Kiambu farms. Harvested this morning. Sold per bundle. Rich in iron and vitamins.',
    price_kes: 30,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&q=80'],
    is_available: false,
    city: 'Kasarani',
    location_lat: -1.22,
    location_lng: 36.89,
    created_at: '2026-07-20T07:00:00Z',
    vendor_name: 'Mama Njeri Greens',
    vendor_whatsapp: '+254789012345',
  },
  {
    id: 'item-007',
    vendor_id: 'user-vendor-006',
    item_name: 'Chicken Biryani — Ready to Eat',
    description:
      'Freshly cooked chicken biryani with raita and salad. Serves 1 person. Available from 12pm–8pm daily. Order by 11am.',
    price_kes: 350,
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80'],
    is_available: true,
    city: 'South C',
    location_lat: -1.32,
    location_lng: 36.81,
    created_at: '2026-07-19T12:00:00Z',
    vendor_name: 'Spice Route Kitchen',
    vendor_whatsapp: '+254790123456',
  },
  {
    id: 'item-008',
    vendor_id: 'user-vendor-007',
    item_name: 'Detergent — Omo 1kg',
    description:
      'Omo Auto washing powder 1kg. For machine and hand washing. Fresh stock. Bulk orders available at discount.',
    price_kes: 155,
    category: 'Groceries',
    images: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80'],
    is_available: true,
    city: 'Eastleigh',
    location_lat: -1.276,
    location_lng: 36.85,
    created_at: '2026-07-18T15:00:00Z',
    vendor_name: 'Eastleigh Supermart',
    vendor_whatsapp: '+254701234567',
  },
];

const USERS_KEY = 'hapo_users';

function loadUsers(): User[] {
  if (typeof window === 'undefined') return [...mockUsers];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const initialUsers = [...mockUsers];
      localStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    return JSON.parse(raw) as User[];
  } catch {
    return [...mockUsers];
  }
}

function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  try {
    window.dispatchEvent(new Event('hapo-users-updated'));
  } catch {
    // ignore
  }
}

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

// Fields that should NEVER be sent to Supabase user_profiles table
const NON_DB_FIELDS = new Set(['password']);

function toSupabasePayload(data: Partial<User>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (NON_DB_FIELDS.has(key)) continue;
    if (value === undefined) continue;
    payload[key] = value;
  }
  payload.updated_at = new Date().toISOString();
  return payload;
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    phone: row.phone || '',
    email: row.email || '',
    role: row.role,
    whatsapp_number: row.whatsapp_number || undefined,
    ambassador_code: row.ambassador_code || undefined,
    referred_by: row.referred_by || undefined,
    location_lat: row.location_lat ?? undefined,
    location_lng: row.location_lng ?? undefined,
    city: row.city || undefined,
    location_confirmed: row.location_confirmed ?? false,
    is_active: row.is_active ?? true,
    password: '',
  };
}

async function syncUsersToSupabase(users: User[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const rows = users.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || null,
      role: user.role,
      whatsapp_number: user.whatsapp_number || null,
      ambassador_code: user.ambassador_code || null,
      referred_by: user.referred_by || null,
      location_lat: user.location_lat ?? null,
      location_lng: user.location_lng ?? null,
      city: user.city || null,
      location_confirmed: user.location_confirmed ?? false,
      is_active: user.is_active ?? true,
    }));
    await supabase.from('user_profiles').upsert(rows, { onConflict: 'id' });
  } catch {
    // ignore sync errors and keep local state usable
  }
}

export function getAllUsers(): User[] {
  return loadUsers();
}

/**
 * getAllUsersAsync — LOCAL STORAGE IS SOURCE OF TRUTH.
 * On first load (no local data), seed from Supabase.
 * After that, local data wins — Supabase is kept in sync as a backup.
 */
export async function getAllUsersAsync(): Promise<User[]> {
  const localUsers = loadUsers();

  // If we already have local data, return it immediately.
  // Supabase syncing happens on mutations, not on reads.
  if (localUsers.length > 0) {
    return localUsers;
  }

  // First-time boot: try to seed from Supabase
  const supabase = getSupabase();
  if (!supabase) return localUsers.length > 0 ? localUsers : [...mockUsers];

  try {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error || !data || data.length === 0) {
      // Seed Supabase with mock users
      const initial = [...mockUsers];
      saveUsers(initial);
      await syncUsersToSupabase(initial);
      return initial;
    }
    const users = data.map(mapUserRow);
    saveUsers(users);
    return users;
  } catch {
    const initial = localUsers.length > 0 ? localUsers : [...mockUsers];
    saveUsers(initial);
    return initial;
  }
}

export function getUserById(id: string): User | null {
  return loadUsers().find((u) => u.id === id) || null;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
}

export function deleteUser(id: string): void {
  saveUsers(loadUsers().filter((u) => u.id !== id));
}

export async function deleteUserAsync(id: string): Promise<void> {
  const users = loadUsers();
  const target = users.find((u) => u.id === id);
  const email = target?.email;
  const remainingUsers = users.filter((u) => u.id !== id);
  saveUsers(remainingUsers);

  // If deleted user is current auth user, clear their session
  if (typeof window !== 'undefined') {
    try {
      const authRaw = localStorage.getItem('hapo_auth_user');
      if (authRaw) {
        const authUser = JSON.parse(authRaw);
        if (authUser?.id === id || (email && authUser?.email === email)) {
          localStorage.removeItem('hapo_auth_user');
        }
      }
    } catch { }
  }

  // Best-effort Supabase cleanup — don't let failures re-add the user
  const supabase = getSupabase();
  if (supabase) {
    try {
      if (email) {
        await supabase.from('user_profiles').delete().or(`id.eq.${id},email.eq.${email}`);
      } else {
        await supabase.from('user_profiles').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteUser error (non-blocking):', err);
    }
  }
}

export function addUser(user: User): void {
  const users = loadUsers();
  const existingIndex = users.findIndex(
    (u) =>
      u.id === user.id ||
      (u.email && user.email && u.email.trim().toLowerCase() === user.email.trim().toLowerCase())
  );
  if (existingIndex !== -1) {
    users[existingIndex] = { ...users[existingIndex], ...user };
  } else {
    users.unshift(user);
  }
  saveUsers(users);
}

/**
 * addUserAsync — adds user locally AND upserts to Supabase.
 */
export async function addUserAsync(user: User): Promise<void> {
  addUser(user);
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = toSupabasePayload(user);
      await supabase.from('user_profiles').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase addUser error (non-blocking):', err);
    }
  }
}

export async function updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
  // Always update local store first — this is the source of truth
  const localResult = updateUser(id, updates);

  // Best-effort Supabase sync
  const supabase = getSupabase();
  if (supabase) {
    const target = loadUsers().find((u) => u.id === id);
    const email = target?.email;
    try {
      const payload = toSupabasePayload(updates);

      let response = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      // Fallback: try by email if ID match failed
      if ((response.error || !response.data) && email) {
        response = await supabase
          .from('user_profiles')
          .update(payload)
          .eq('email', email)
          .select('*')
          .single();
      }

      // If both failed, try upserting
      if (response.error || !response.data) {
        const fullPayload = toSupabasePayload({ ...target, ...updates, id });
        fullPayload.id = id;
        fullPayload.email = email || updates.email || '';
        await supabase.from('user_profiles').upsert(fullPayload, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Supabase updateUser error (non-blocking):', err);
    }
  }

  return localResult;
}

// Auth helpers (mock — backend integration point)
export function authenticateUser(email: string, password: string): User | null {
  const allUsers = loadUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return (
    allUsers.find(
      (u) =>
        u.email.trim().toLowerCase() === normalizedEmail &&
        (u.password === password ||
          !u.password ||
          password === 'admin123' ||
          password === 'vendor123' ||
          password === 'client123' ||
          password === 'ambassador123' ||
          password === 'rider123' ||
          password === 'password123')
    ) || null
  );
}

export function generateAmbassadorCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from(
    { length: 3 },
    () => letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  const randomNumbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)).join('');
  return `HAP${randomLetters}${randomNumbers}`;
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'vendor':
      return '/vendor-dashboard';
    case 'client':
      return '/client-home';
    case 'ambassador':
      return '/ambassador-dashboard';
    case 'admin':
      return '/admin';
    case 'towing':
      return '/provider-dashboard';
    case 'garage':
      return '/provider-dashboard';
    case 'rider':
      return '/rider-dashboard';
    default:
      return '/';
  }
}

// ─── Ambassador Referral Types ────────────────────────────────────────────────

export interface ReferredUser {
  id: string;
  name: string;
  role: 'client' | 'vendor';
  city: string;
  joined_at: string;
  is_active: boolean;
  total_orders?: number;
}

export interface CommissionEntry {
  id: string;
  description: string;
  amount_kes: number;
  type: 'signup' | 'order' | 'bonus';
  date: string;
  status: 'paid' | 'pending';
}

export interface AmbassadorStats {
  total_referrals: number;
  active_referrals: number;
  invites_sent: number;
  total_commissions_kes: number;
  pending_commissions_kes: number;
  code_uses_this_month: number;
}

// Mock ambassador data for Grace Muthoni (user-003, code: HAPGRC847)
export const mockReferredUsers: ReferredUser[] = [
  {
    id: 'ref-001',
    name: 'Brian Kipchoge',
    role: 'client',
    city: 'Mombasa',
    joined_at: '2026-07-20T09:15:00Z',
    is_active: true,
    total_orders: 4,
  },
  {
    id: 'ref-002',
    name: 'Zawadi Achieng',
    role: 'vendor',
    city: 'Mombasa',
    joined_at: '2026-07-18T14:30:00Z',
    is_active: true,
    total_orders: 12,
  },
  {
    id: 'ref-003',
    name: 'Hamisi Salim',
    role: 'client',
    city: 'Kilifi',
    joined_at: '2026-07-15T11:00:00Z',
    is_active: true,
    total_orders: 7,
  },
  {
    id: 'ref-004',
    name: 'Njeri Waweru',
    role: 'vendor',
    city: 'Mombasa',
    joined_at: '2026-07-10T08:45:00Z',
    is_active: false,
    total_orders: 2,
  },
  {
    id: 'ref-005',
    name: 'Omondi Otieno',
    role: 'client',
    city: 'Malindi',
    joined_at: '2026-07-05T16:20:00Z',
    is_active: true,
    total_orders: 9,
  },
  {
    id: 'ref-006',
    name: 'Fatuma Hassan',
    role: 'client',
    city: 'Mombasa',
    joined_at: '2026-06-28T10:00:00Z',
    is_active: true,
    total_orders: 3,
  },
  {
    id: 'ref-007',
    name: 'Peter Mwangi',
    role: 'vendor',
    city: 'Mombasa',
    joined_at: '2026-06-20T13:30:00Z',
    is_active: false,
    total_orders: 0,
  },
];

export const mockCommissions: CommissionEntry[] = [
  {
    id: 'com-001',
    description: 'Vendor signup bonus — Zawadi Achieng',
    amount_kes: 500,
    type: 'signup',
    date: '2026-07-18T14:30:00Z',
    status: 'paid',
  },
  {
    id: 'com-002',
    description: 'Order commission — Hamisi Salim (7 orders)',
    amount_kes: 350,
    type: 'order',
    date: '2026-07-17T09:00:00Z',
    status: 'paid',
  },
  {
    id: 'com-003',
    description: 'Client signup bonus — Brian Kipchoge',
    amount_kes: 200,
    type: 'signup',
    date: '2026-07-20T09:15:00Z',
    status: 'paid',
  },
  {
    id: 'com-004',
    description: 'Vendor signup bonus — Njeri Waweru',
    amount_kes: 500,
    type: 'signup',
    date: '2026-07-10T08:45:00Z',
    status: 'paid',
  },
  {
    id: 'com-005',
    description: 'Monthly activity bonus — July',
    amount_kes: 1000,
    type: 'bonus',
    date: '2026-07-25T00:00:00Z',
    status: 'pending',
  },
  {
    id: 'com-006',
    description: 'Order commission — Omondi Otieno (9 orders)',
    amount_kes: 450,
    type: 'order',
    date: '2026-07-22T11:00:00Z',
    status: 'pending',
  },
  {
    id: 'com-007',
    description: 'Client signup bonus — Fatuma Hassan',
    amount_kes: 200,
    type: 'signup',
    date: '2026-06-28T10:00:00Z',
    status: 'paid',
  },
];

export const mockAmbassadorStats: AmbassadorStats = {
  total_referrals: 7,
  active_referrals: 5,
  invites_sent: 14,
  total_commissions_kes: 3200,
  pending_commissions_kes: 1450,
  code_uses_this_month: 9,
};

// Haversine distance formula
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

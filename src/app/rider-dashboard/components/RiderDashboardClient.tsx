'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  TrendingUp,
  Wallet,
  Clock,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  MapPin,
  Star,
  ToggleLeft,
  ToggleRight,
  Package,
} from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { getAuthUser } from '@/lib/authStore';
import {
  getAllRiders,
  getRiderProfile,
  getRiderByUserIdAsync,
  getDeliveryRequestsByRiderAsync,
  updateRiderAvailabilityAsync,
  DeliveryRider,
} from '@/lib/deliveryStore';

function formatKES(n: number): string {
  return `KES ${n.toLocaleString('en-KE')}`;
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface TripEntry {
  id: string;
  orderId: string;
  clientName: string;
  pickupArea: string;
  deliveryArea: string;
  distanceKm: number;
  earningKes: number;
  status: 'delivered' | 'cancelled' | 'in_progress';
  date: string;
}

interface PayoutEntry {
  id: string;
  amount_kes: number;
  status: 'paid' | 'pending';
  method: string;
  date: string;
  reference: string;
}

const MOCK_TRIPS: TripEntry[] = [
  {
    id: 't-001',
    orderId: 'ORD-2847',
    clientName: 'Amina Wanjiku',
    pickupArea: 'Westlands',
    deliveryArea: 'Parklands',
    distanceKm: 3.2,
    earningKes: 260,
    status: 'delivered',
    date: '2026-07-28T14:30:00Z',
  },
  {
    id: 't-002',
    orderId: 'ORD-2831',
    clientName: 'Brian Omondi',
    pickupArea: 'CBD Nairobi',
    deliveryArea: 'Kasarani',
    distanceKm: 8.5,
    earningKes: 525,
    status: 'delivered',
    date: '2026-07-27T11:15:00Z',
  },
  {
    id: 't-003',
    orderId: 'ORD-2819',
    clientName: 'Cynthia Auma',
    pickupArea: 'Lavington',
    deliveryArea: 'Westlands',
    distanceKm: 4.1,
    earningKes: 305,
    status: 'delivered',
    date: '2026-07-26T16:45:00Z',
  },
  {
    id: 't-004',
    orderId: 'ORD-2805',
    clientName: 'David Kamau',
    pickupArea: 'South C',
    deliveryArea: 'Langata',
    distanceKm: 2.8,
    earningKes: 240,
    status: 'cancelled',
    date: '2026-07-25T09:00:00Z',
  },
  {
    id: 't-005',
    orderId: 'ORD-2790',
    clientName: 'Esther Njeri',
    pickupArea: 'Kasarani',
    deliveryArea: 'CBD Nairobi',
    distanceKm: 9.0,
    earningKes: 550,
    status: 'delivered',
    date: '2026-07-24T13:20:00Z',
  },
  {
    id: 't-006',
    orderId: 'ORD-2775',
    clientName: 'Felix Mwangi',
    pickupArea: 'Parklands',
    deliveryArea: 'Lavington',
    distanceKm: 5.5,
    earningKes: 375,
    status: 'delivered',
    date: '2026-07-23T10:00:00Z',
  },
  {
    id: 't-007',
    orderId: 'ORD-2760',
    clientName: 'Grace Otieno',
    pickupArea: 'Karen',
    deliveryArea: 'South C',
    distanceKm: 6.2,
    earningKes: 422,
    status: 'delivered',
    date: '2026-07-22T15:30:00Z',
  },
];

const MOCK_PAYOUTS: PayoutEntry[] = [
  {
    id: 'pay-001',
    amount_kes: 2500,
    status: 'paid',
    method: 'M-Pesa',
    date: '2026-07-25T08:00:00Z',
    reference: 'MPE7X2K9',
  },
  {
    id: 'pay-002',
    amount_kes: 1800,
    status: 'paid',
    method: 'M-Pesa',
    date: '2026-07-18T08:00:00Z',
    reference: 'MPE4A1R3',
  },
  {
    id: 'pay-003',
    amount_kes: 3200,
    status: 'paid',
    method: 'M-Pesa',
    date: '2026-07-11T08:00:00Z',
    reference: 'MPE9B5T7',
  },
  {
    id: 'pay-004',
    amount_kes: 1677,
    status: 'pending',
    method: 'M-Pesa',
    date: '2026-07-29T00:00:00Z',
    reference: '—',
  },
];

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, accent }: StatCardProps) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${accent ? 'ring-2 ring-primary/20' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <div>
        <p
          className={`text-2xl font-extrabold font-tabular ${accent ? 'text-primary' : 'text-card-foreground'}`}
        >
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-700',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-400' },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    dot: 'bg-blue-500',
  },
};

function TripHistoryTable({ trips }: { trips: TripEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? trips : trips.slice(0, 5);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-card-foreground">Trip History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{trips.length} total trips</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {trips.filter((t) => t.status === 'delivered').length} Completed
        </span>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Order', 'Client', 'Route', 'Distance', 'Earning', 'Date', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((t, i) => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <td className="px-5 py-3.5 font-tabular font-semibold text-primary text-xs">
                    {t.orderId}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-card-foreground">{t.clientName}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <MapPin size={12} className="text-primary flex-shrink-0" />
                      <span>{t.pickupArea}</span>
                      <span className="text-muted-foreground/50">→</span>
                      <span>{t.deliveryArea}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-tabular text-muted-foreground">
                    {t.distanceKm} km
                  </td>
                  <td className="px-5 py-3.5 font-extrabold font-tabular text-card-foreground">
                    {t.status === 'cancelled' ? (
                      <span className="text-muted-foreground line-through">
                        {formatKES(t.earningKes)}
                      </span>
                    ) : (
                      `+${formatKES(t.earningKes)}`
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-border">
        {visible.map((t) => {
          const cfg = STATUS_CONFIG[t.status];
          return (
            <div key={t.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="text-xs font-bold text-primary font-tabular">{t.orderId}</span>
                  <p className="text-sm font-semibold text-card-foreground">{t.clientName}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} flex-shrink-0`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <MapPin size={11} className="text-primary" />
                {t.pickupArea} → {t.deliveryArea} · {t.distanceKm} km
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                <span
                  className={`text-sm font-extrabold font-tabular ${t.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}
                >
                  {t.status === 'cancelled'
                    ? formatKES(t.earningKes)
                    : `+${formatKES(t.earningKes)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {trips.length > 5 && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={16} /> View all {trips.length} trips
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function PayoutHistory({ payouts }: { payouts: PayoutEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? payouts : payouts.slice(0, 4);
  const paid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount_kes, 0);
  const pending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + p.amount_kes, 0);
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-card-foreground">Payout History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{payouts.length} transactions</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <BadgeCheck size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Paid Out</span>
            </div>
            <p className="text-base font-extrabold font-tabular text-emerald-700">
              {formatKES(paid)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">Pending</span>
            </div>
            <p className="text-base font-extrabold font-tabular text-amber-700">
              {formatKES(pending)}
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {visible.map((p) => (
          <div
            key={p.id}
            className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${p.status === 'paid' ? 'bg-emerald-100' : 'bg-amber-100'}`}
            >
              <Wallet
                size={15}
                className={p.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground">{p.method} Payout</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                {p.reference !== '—' && (
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {p.reference}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-extrabold font-tabular text-card-foreground">
                {formatKES(p.amount_kes)}
              </p>
              <span
                className={`text-xs font-semibold ${p.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {p.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>
      {payouts.length > 4 && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={16} /> View all {payouts.length} payouts
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function RiderDashboardClient() {
  const user = getAuthUser();
  const [riderProfile, setRiderProfile] = useState<DeliveryRider | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [trips, setTrips] = useState<TripEntry[]>(MOCK_TRIPS);
  const [payouts] = useState<PayoutEntry[]>(MOCK_PAYOUTS);

  useEffect(() => {
    async function loadRider() {
      if (user?.id) {
        try {
          const supabaseRider = await getRiderByUserIdAsync(user.id);
          if (supabaseRider) {
            setRiderProfile(supabaseRider);
            setIsAvailable(supabaseRider.isAvailable);
            // Load real delivery requests
            const requests = await getDeliveryRequestsByRiderAsync(supabaseRider.id);
            if (requests.length > 0) {
              const mapped: TripEntry[] = requests.map((r) => ({
                id: r.id,
                orderId: r.orderId || r.id.slice(0, 8).toUpperCase(),
                clientName: r.clientName,
                pickupArea: r.pickupAddress.split(',')[0] || r.pickupAddress,
                deliveryArea: r.deliveryAddress.split(',')[0] || r.deliveryAddress,
                distanceKm: r.estimatedDistanceKm,
                earningKes: r.deliveryFee,
                status:
                  r.status === 'delivered'
                    ? 'delivered'
                    : r.status === 'cancelled'
                      ? 'cancelled'
                      : 'in_progress',
                date: r.createdAt,
              }));
              setTrips(mapped);
            }
            return;
          }
        } catch {}
      }
      // Fallback to localStorage profile
      const profile = getRiderProfile();
      if (profile) {
        setRiderProfile(profile);
        setIsAvailable(profile.isAvailable);
      } else {
        const allRiders = getAllRiders();
        const matched = allRiders.find((r) => r.userId === user?.id) ?? allRiders[0];
        if (matched) {
          setRiderProfile(matched);
          setIsAvailable(matched.isAvailable);
        }
      }
    }
    loadRider();
  }, [user?.id]);

  const handleToggleAvailability = async () => {
    if (!riderProfile) return;
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    try {
      await updateRiderAvailabilityAsync(riderProfile.id, newVal);
    } catch {}
  };

  const deliveredTrips = trips.filter((t) => t.status === 'delivered');
  const totalEarnings = deliveredTrips.reduce((s, t) => s + t.earningKes, 0);
  const pendingPayout = payouts
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + p.amount_kes, 0);
  const avgEarningPerTrip =
    deliveredTrips.length > 0 ? Math.round(totalEarnings / deliveredTrips.length) : 0;

  const bikeTypeLabel: Record<string, string> = {
    motorcycle: 'Motorcycle',
    bicycle: 'Bicycle',
    cargo_bike: 'Cargo Bike',
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-screen-xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-card-foreground">Rider Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back,{' '}
              <span className="font-semibold text-primary">
                {user?.first_name ?? riderProfile?.name?.split(' ')[0]}
              </span>
              ! Here&apos;s your delivery performance.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {riderProfile && (
              <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Bike size={16} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-card-foreground leading-none">
                      {bikeTypeLabel[riderProfile.bikeType] ?? riderProfile.bikeType}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs text-muted-foreground font-tabular">
                        {riderProfile.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-px h-8 bg-border mx-1" />
                <button
                  onClick={handleToggleAvailability}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors"
                  aria-label="Toggle availability"
                >
                  {isAvailable ? (
                    <>
                      <ToggleRight size={22} className="text-emerald-500" />
                      <span className="text-emerald-600">Online</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={22} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Offline</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Trips"
            value={String(trips.length)}
            sub={`${deliveredTrips.length} completed · ${trips.filter((t) => t.status === 'cancelled').length} cancelled`}
            icon={Package}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            accent
          />
          <StatCard
            label="Avg Earning / Trip"
            value={formatKES(avgEarningPerTrip)}
            sub="Per completed delivery"
            icon={TrendingUp}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            label="Cumulative Balance"
            value={formatKES(totalEarnings)}
            sub="Total earned (all time)"
            icon={Wallet}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Pending Payout"
            value={formatKES(pendingPayout)}
            sub="Awaiting disbursement"
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <TripHistoryTable trips={trips} />
          </div>
          <div className="xl:col-span-2">
            <PayoutHistory payouts={payouts} />
          </div>
        </div>

        {/* Earnings tip banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-blue-50 to-blue-100 border border-blue-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center flex-shrink-0">
            <Bike size={20} className="text-blue-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900">Boost your earnings this week!</p>
            <p className="text-xs text-blue-800 mt-0.5">
              Complete <span className="font-bold">10+ deliveries</span> this week and earn a{' '}
              <span className="font-bold">KES 500 bonus</span>. Stay online during peak hours
              (11am–2pm &amp; 6pm–9pm) for more requests.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold flex-shrink-0">
            <MapPin size={15} />
            {riderProfile?.city ?? 'Your Area'}
          </div>
        </div>
      </main>
    </div>
  );
}

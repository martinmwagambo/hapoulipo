'use client';

import React, { useState, useEffect, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider } from '@/components/ui/Toast';
import { getAuthUser } from '@/lib/authStore';
import {
  getClientOrders,
  getClientOrdersAsync,
  type VendorOrder,
  type VendorOrderStatus,
} from '@/lib/ordersStore';
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Package,
  MapPin,
  CreditCard,
  Receipt,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  VendorOrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode; trackStep: number }
> = {
  pending: {
    label: 'Order Placed',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Clock size={13} />,
    trackStep: 1,
  },
  shipped: {
    label: 'On the Way',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Truck size={13} />,
    trackStep: 2,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 size={13} />,
    trackStep: 3,
  },
};

// ─── Tracking Progress Bar ────────────────────────────────────────────────────
function TrackingBar({ status }: { status: VendorOrderStatus }) {
  const step = STATUS_CONFIG[status].trackStep;
  const steps = [
    { label: 'Order Placed', icon: <Receipt size={14} />, step: 1 },
    { label: 'On the Way', icon: <Truck size={14} />, step: 2 },
    { label: 'Delivered', icon: <CheckCircle2 size={14} />, step: 3 },
  ];

  return (
    <div className="px-4 sm:px-5 pb-4 pt-2">
      <div className="flex items-center gap-0">
        {steps.map((s, idx) => {
          const done = step >= s.step;
          const active = step === s.step;
          return (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    done
                      ? active
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.icon}
                </div>
                <span
                  className={`text-[10px] font-semibold text-center leading-tight ${
                    done ? (active ? 'text-primary' : 'text-green-600') : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-1 rounded-full transition-all ${
                    step > s.step ? 'bg-green-400' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: VendorOrder;
}

function ClientOrderCard({ order }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];

  const [formattedDate, setFormattedDate] = useState('');
  useEffect(() => {
    if (order.createdAt) {
      setFormattedDate(
        new Date(order.createdAt).toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [order.createdAt]);

  const platformCut = Math.round(order.totalAmount * 0.1);
  const ambassadorCut = Math.round(order.totalAmount * 0.05);

  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div className="flex items-start gap-4 p-4 sm:p-5">
        {/* Product image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.itemImage} alt={order.itemName} className="w-full h-full object-cover" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-0.5">{order.orderId}</p>
              <h3 className="text-sm font-bold text-card-foreground leading-snug">
                {order.itemName}
              </h3>
            </div>
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} flex-shrink-0`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-muted-foreground">
              Qty: <span className="font-semibold text-card-foreground">{order.quantity}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Total paid:{' '}
              <span className="font-semibold text-card-foreground">
                KES {order.totalAmount.toLocaleString()}
              </span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Tracking bar */}
      <div className="border-t border-border">
        <TrackingBar status={order.status} />
      </div>

      {/* Shipping note (if any) */}
      {order.shippingNote && (
        <div className="mx-4 sm:mx-5 mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <MessageSquare size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-blue-600 mb-0.5 uppercase tracking-wide">
              Vendor Update
            </p>
            <p className="text-xs text-blue-700">{order.shippingNote}</p>
          </div>
        </div>
      )}

      {/* Expandable order details */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <span>Order & Payment Details</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="px-4 sm:px-5 pb-4 space-y-3">
            {/* Delivery info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin size={13} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Address</p>
                  <p className="text-sm font-semibold text-card-foreground">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <CreditCard size={13} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-semibold text-card-foreground capitalize">
                    {order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Transfer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs font-bold text-card-foreground mb-2 flex items-center gap-1.5">
                <Package size={13} className="text-muted-foreground" />
                Payment Breakdown
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {order.itemName} × {order.quantity}
                  </span>
                  <span className="font-semibold text-card-foreground">
                    KES {order.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Platform fee (10%)</span>
                  <span className="text-card-foreground">KES {platformCut.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Ambassador commission (5%)</span>
                  <span className="text-card-foreground">KES {ambassadorCut.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Vendor receives</span>
                  <span className="text-green-600 font-semibold">
                    KES {order.vendorPayout.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-xs font-bold">
                  <span className="text-card-foreground">Total Paid</span>
                  <span className="text-card-foreground">
                    KES {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main inner component ─────────────────────────────────────────────────────
function ClientOrdersInner() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState<VendorOrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const user = getAuthUser();

  const loadOrders = useCallback(async () => {
    if (user?.email) {
      setIsLoading(true);
      try {
        const loaded = await getClientOrdersAsync(user.email);
        setOrders(loaded);
      } catch {
        setOrders(getClientOrders(user.email));
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const TABS: { key: VendorOrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Placed' },
    { key: 'shipped', label: 'On the Way' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-lg mx-auto px-4 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your purchases and delivery status
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Orders',
              value: counts.all,
              color: 'text-card-foreground',
              icon: <ShoppingBag size={18} />,
            },
            {
              label: 'Placed',
              value: counts.pending,
              color: 'text-amber-600',
              icon: <Clock size={18} />,
            },
            {
              label: 'On the Way',
              value: counts.shipped,
              color: 'text-blue-600',
              icon: <Truck size={18} />,
            },
            {
              label: 'Delivered',
              value: counts.delivered,
              color: 'text-green-600',
              icon: <CheckCircle2 size={18} />,
            },
          ].map((stat) => (
            <div key={stat.label} className="card px-5 py-4 flex items-center gap-3">
              <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`text-2xl font-extrabold font-tabular ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total spent banner */}
        {orders.length > 0 && (
          <div
            className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2d8a4e 100%)' }}
          >
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Total Spent
              </p>
              <p className="text-2xl font-extrabold text-white mt-0.5">
                KES {totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Receipt size={22} className="text-white" />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                filter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShoppingBag size={26} className="text-muted-foreground" />
            </div>
            <p className="text-base font-bold text-card-foreground mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {filter === 'all'
                ? 'Your purchases will appear here once you place an order.'
                : `No ${filter === 'pending' ? 'placed' : filter} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order) => (
              <ClientOrderCard key={order.orderId} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientOrdersClient() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="client">
        <ClientOrdersInner />
      </RoleGuard>
    </ToastProvider>
  );
}

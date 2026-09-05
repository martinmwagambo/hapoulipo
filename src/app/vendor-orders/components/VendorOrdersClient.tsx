'use client';

import React, { useState, useEffect, useCallback } from 'react';

import RoleGuard from '@/components/RoleGuard';
import DashboardNav from '@/components/DashboardNav';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { getAuthUser } from '@/lib/authStore';
import {
  getVendorOrders,
  getVendorOrdersAsync,
  updateOrderStatusAsync,
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
  X,
  Package,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  VendorOrderStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Clock size={13} />,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <Truck size={13} />,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle2 size={13} />,
  },
};

const NEXT_STATUS: Record<VendorOrderStatus, VendorOrderStatus | null> = {
  pending: 'shipped',
  shipped: 'delivered',
  delivered: null,
};

const NEXT_LABEL: Record<VendorOrderStatus, string> = {
  pending: 'Mark as Shipped',
  shipped: 'Mark as Delivered',
  delivered: '',
};

// ─── Shipping Note Modal ──────────────────────────────────────────────────────
interface ShippingModalProps {
  order: VendorOrder;
  nextStatus: VendorOrderStatus;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

function ShippingModal({ order, nextStatus, onConfirm, onClose }: ShippingModalProps) {
  const [note, setNote] = useState(order.shippingNote ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: nextStatus === 'shipped' ? '#dbeafe' : '#dcfce7' }}
          >
            {nextStatus === 'shipped' ? (
              <Truck size={20} className="text-blue-600" />
            ) : (
              <CheckCircle2 size={20} className="text-green-600" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-card-foreground">
              {nextStatus === 'shipped' ? 'Send Shipping Update' : 'Confirm Delivery'}
            </h3>
            <p className="text-xs text-muted-foreground">Order #{order.orderId}</p>
          </div>
        </div>

        <div className="bg-muted rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5">Product</p>
          <p className="text-sm font-medium text-card-foreground">{order.itemName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Buyer: {order.buyerName}</p>
        </div>

        <label className="block text-sm font-semibold text-card-foreground mb-2">
          <MessageSquare size={14} className="inline mr-1.5 text-muted-foreground" />
          {nextStatus === 'shipped' ? 'Shipping note (optional)' : 'Delivery note (optional)'}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            nextStatus === 'shipped'
              ? 'e.g. Dispatched via boda boda. ETA 30 mins.'
              : 'e.g. Delivered and confirmed by buyer.'
          }
          className="w-full px-3 py-2.5 rounded-xl border border-border text-sm text-card-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ backgroundColor: nextStatus === 'shipped' ? '#2563eb' : '#16a34a' }}
          >
            {nextStatus === 'shipped' ? 'Mark Shipped' : 'Mark Delivered'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
interface OrderCardProps {
  order: VendorOrder;
  onUpdateStatus: (order: VendorOrder) => void;
}

function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const next = NEXT_STATUS[order.status];

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

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
              Total:{' '}
              <span className="font-semibold text-card-foreground">
                KES {order.totalAmount.toLocaleString()}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              Your payout:{' '}
              <span className="font-semibold text-green-600">
                KES {order.vendorPayout.toLocaleString()}
              </span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Shipping note (if any) */}
      {order.shippingNote && (
        <div className="mx-4 sm:mx-5 mb-3 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
          <MessageSquare size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">{order.shippingNote}</p>
        </div>
      )}

      {/* Expandable buyer details */}
      <div className="border-t border-border">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
        >
          <span>Buyer & Order Details</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="px-4 sm:px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Package size={13} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Buyer</p>
                <p className="text-sm font-semibold text-card-foreground">{order.buyerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Phone size={13} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-semibold text-card-foreground">{order.buyerPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Mail size={13} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-card-foreground truncate">
                  {order.buyerEmail}
                </p>
              </div>
            </div>
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
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-semibold text-card-foreground capitalize">
                  {order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Bank Transfer'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {next && (
        <div className="border-t border-border px-4 sm:px-5 py-3 flex items-center justify-end gap-2">
          <button
            onClick={() => onUpdateStatus(order)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
              next === 'shipped'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {next === 'shipped' ? <Truck size={15} /> : <CheckCircle2 size={15} />}
            {NEXT_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main inner component ─────────────────────────────────────────────────────
function VendorOrdersInner() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [filter, setFilter] = useState<VendorOrderStatus | 'all'>('all');
  const [modalOrder, setModalOrder] = useState<VendorOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const user = getAuthUser();

  const loadOrders = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      try {
        const loaded = await getVendorOrdersAsync(user.id);
        setOrders(loaded);
      } catch {
        setOrders(getVendorOrders(user.id));
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = (order: VendorOrder) => {
    setModalOrder(order);
  };

  const handleConfirmUpdate = async (note: string) => {
    if (!modalOrder) return;
    const next = NEXT_STATUS[modalOrder.status];
    if (!next) return;
    const success = await updateOrderStatusAsync(modalOrder.orderId, next, note || undefined);
    if (success) {
      await loadOrders();
      showToast(`Order ${modalOrder.orderId} marked as ${STATUS_CONFIG[next].label}`, 'success');
    } else {
      showToast('Failed to update order status', 'error');
    }
    setModalOrder(null);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  const TABS: { key: VendorOrderStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="max-w-screen-lg mx-auto px-4 lg:px-8 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-card-foreground">Incoming Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and fulfil orders from your buyers
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
              label: 'Pending',
              value: counts.pending,
              color: 'text-amber-600',
              icon: <Clock size={18} />,
            },
            {
              label: 'Shipped',
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
                ? 'When buyers purchase your products, their orders will appear here.'
                : `No ${filter} orders at the moment.`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order) => (
              <OrderCard key={order.orderId} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )}
      </main>

      {/* Shipping/Delivery modal */}
      {modalOrder && NEXT_STATUS[modalOrder.status] && (
        <ShippingModal
          order={modalOrder}
          nextStatus={NEXT_STATUS[modalOrder.status]!}
          onConfirm={handleConfirmUpdate}
          onClose={() => setModalOrder(null)}
        />
      )}
    </div>
  );
}

export default function VendorOrdersClient() {
  return (
    <ToastProvider>
      <RoleGuard allowedRole="vendor">
        <VendorOrdersInner />
      </RoleGuard>
    </ToastProvider>
  );
}

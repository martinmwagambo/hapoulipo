// Payment split configuration for Hapo Ulipo Services
// Platform takes 10%, Ambassador gets 5%, Vendor gets 85%

export const PAYMENT_CONFIG = {
  PLATFORM_CUT_PERCENT: 10,
  AMBASSADOR_CUT_PERCENT: 5,
  VENDOR_CUT_PERCENT: 85,
  CURRENCY: 'KES',
  COUNTRY: 'KE',
} as const;

export interface PaymentSplit {
  totalAmount: number;
  platformCut: number;
  ambassadorCut: number;
  vendorPayout: number;
}

export function calculateSplit(totalAmount: number, hasAmbassador: boolean): PaymentSplit {
  const platformCut = Math.round((totalAmount * PAYMENT_CONFIG.PLATFORM_CUT_PERCENT) / 100);
  const ambassadorCut = hasAmbassador
    ? Math.round((totalAmount * PAYMENT_CONFIG.AMBASSADOR_CUT_PERCENT) / 100)
    : 0;
  const vendorPayout = totalAmount - platformCut - ambassadorCut;

  return {
    totalAmount,
    platformCut,
    ambassadorCut,
    vendorPayout,
  };
}

export interface OrderData {
  orderId: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  ambassadorId?: string;
  ambassadorPhone?: string;
  paymentMethod: 'mpesa' | 'bank';
  payoutPhone?: string;
  payoutBankAccount?: string;
  payoutBankCode?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'payment_processing'
  | 'payment_confirmed'
  | 'payout_processing'
  | 'completed'
  | 'failed';

export interface Order extends OrderData {
  status: OrderStatus;
  split: PaymentSplit;
  flutterwaveRef?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory order store (replace with DB in production)
const orderStore: Map<string, Order> = new Map();

export function saveOrder(order: Order): void {
  orderStore.set(order.orderId, order);
  if (typeof window !== 'undefined') {
    try {
      const orders = JSON.parse(localStorage.getItem('hapo_orders') || '[]');
      const idx = orders.findIndex((o: Order) => o.orderId === order.orderId);
      if (idx >= 0) orders[idx] = order;
      else orders.unshift(order);
      localStorage.setItem('hapo_orders', JSON.stringify(orders.slice(0, 50)));
    } catch {
      /* ignore */
    }
  }
}

export function getOrder(orderId: string): Order | null {
  if (orderStore.has(orderId)) return orderStore.get(orderId)!;
  if (typeof window !== 'undefined') {
    try {
      const orders = JSON.parse(localStorage.getItem('hapo_orders') || '[]');
      return orders.find((o: Order) => o.orderId === orderId) || null;
    } catch {
      return null;
    }
  }
  return null;
}

export function getClientOrders(clientId: string): Order[] {
  if (typeof window !== 'undefined') {
    try {
      const orders = JSON.parse(localStorage.getItem('hapo_orders') || '[]');
      return orders.filter((o: Order) => o.clientId === clientId);
    } catch {
      return [];
    }
  }
  return [];
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

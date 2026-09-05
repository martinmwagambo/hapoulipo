import type { VendorItem } from './mockData';

export interface CartItem extends VendorItem {
  quantity: number;
}

const CART_KEY = 'hapo_cart_items';

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getCartItems(): CartItem[] {
  return readCart();
}

export function addToCart(item: VendorItem, quantity = 1): CartItem[] {
  const cart = readCart();
  const existing = cart.find((entry) => entry.id === item.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }

  writeCart(cart);
  return cart;
}

export function updateCartQuantity(itemId: string, quantity: number): CartItem[] {
  const cart = readCart();
  const next = cart
    .map((entry) => (entry.id === itemId ? { ...entry, quantity: Math.max(1, quantity) } : entry))
    .filter((entry) => entry.id !== itemId || entry.quantity > 0);

  writeCart(next);
  return next;
}

export function removeFromCart(itemId: string): CartItem[] {
  const cart = readCart().filter((entry) => entry.id !== itemId);
  writeCart(cart);
  return cart;
}

export function clearCart(): void {
  writeCart([]);
}

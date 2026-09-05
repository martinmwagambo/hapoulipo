'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Bike,
  MapPin,
  Package,
} from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { getAuthUser } from '@/lib/authStore';
import { getAvailableItems } from '@/lib/vendorItemsStore';
import { mockUsers } from '@/lib/mockData';
import { calculateSplit } from '@/lib/paymentConfig';
import {
  getAvailableRiders,
  calculateDeliveryFee,
  haversineKm,
  type DeliveryRider,
} from '@/lib/deliveryStore';
import type { VendorItem } from '@/lib/mockData';
import {
  addToCart,
  clearCart,
  getCartItems,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from '@/lib/cartStore';

const KENYAN_BANKS = [
  { code: '011', name: 'Co-operative Bank' },
  { code: '012', name: 'Equity Bank' },
  { code: '016', name: 'KCB Bank' },
  { code: '023', name: 'Standard Chartered' },
  { code: '031', name: 'Barclays / ABSA' },
  { code: '035', name: 'Stanbic Bank' },
  { code: '050', name: 'I&M Bank' },
  { code: '054', name: 'Diamond Trust Bank' },
  { code: '063', name: 'Family Bank' },
  { code: '072', name: 'Gulf African Bank' },
];

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item_id');
  const qty = parseInt(searchParams.get('qty') || '1', 10);

  const [item, setItem] = useState<VendorItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('011');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Delivery state
  const [wantsDelivery, setWantsDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [availableRiders, setAvailableRiders] = useState<DeliveryRider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  const user = getAuthUser();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    const existingCart = getCartItems();
    if (!itemId) {
      if (existingCart.length === 0) {
        router.push('/client-home');
        return;
      }
      setCartItems(existingCart);
      setItem(existingCart[0] ?? null);
    } else {
      const items = getAvailableItems();
      const found = items.find((i) => i.id === itemId);
      if (!found) {
        if (existingCart.length === 0) {
          router.push('/client-home');
          return;
        }
        setCartItems(existingCart);
        setItem(existingCart[0] ?? null);
        return;
      }

      const nextCart = existingCart.some((entry) => entry.id === found.id)
        ? existingCart
        : addToCart(found, qty);

      setCartItems(nextCart);
      setItem(found);
    }
    if (user.phone) setMpesaPhone(user.phone);

    // Load available riders
    const riders = getAvailableRiders();
    setAvailableRiders(riders);
    if (riders.length > 0) setSelectedRiderId(riders[0].id);
  }, [itemId, qty, user, router]);

  // Recalculate delivery fee when rider or item changes
  useEffect(() => {
    if (!wantsDelivery || !selectedRiderId || !item) {
      setDeliveryFee(0);
      return;
    }
    const rider = availableRiders.find((r) => r.id === selectedRiderId);
    if (!rider) {
      setDeliveryFee(0);
      return;
    }

    const userLat = user?.location_lat;
    const userLng = user?.location_lng;
    let distKm = 3; // default estimate
    if (userLat && userLng && item.location_lat && item.location_lng) {
      distKm = haversineKm(item.location_lat, item.location_lng, userLat, userLng);
    }
    setDeliveryFee(calculateDeliveryFee(rider, Math.max(1, distKm)));
  }, [wantsDelivery, selectedRiderId, item, availableRiders, user]);

  if (!user) return null;
  if (!item && cartItems.length === 0) return null;

  const totalAmount = cartItems.reduce((sum, entry) => sum + entry.price_kes * entry.quantity, 0);
  const ambassadorUser = user.referred_by ? mockUsers.find((u) => u.id === user.referred_by) : null;
  const hasAmbassador = !!ambassadorUser;
  const split = calculateSplit(totalAmount, hasAmbassador);
  const grandTotal = totalAmount + (wantsDelivery ? deliveryFee : 0);

  const updateQuantity = (itemId: string, nextQuantity: number) => {
    setCartItems(updateCartQuantity(itemId, nextQuantity));
  };

  const removeItem = (itemId: string) => {
    const nextCart = removeFromCart(itemId);
    setCartItems(nextCart);
    if (nextCart.length === 0) {
      setItem(null);
    } else {
      setItem(nextCart[0] ?? null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'mpesa' && !mpesaPhone.trim()) {
      setError('Please enter your M-Pesa phone number');
      return;
    }
    if (paymentMethod === 'bank' && (!bankAccount.trim() || !bankCode)) {
      setError('Please enter your bank account details');
      return;
    }
    if (wantsDelivery && !deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setIsLoading(true);

    try {
      const vendorUser = mockUsers.find(
        (u) => u.id === (item?.vendor_id || cartItems[0]?.vendor_id)
      );
      const selectedRider = availableRiders.find((r) => r.id === selectedRiderId);

      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item?.id || cartItems[0]?.id,
          itemName: item?.item_name || cartItems[0]?.item_name,
          itemPrice: item?.price_kes || cartItems[0]?.price_kes,
          quantity: item ? qty : cartItems.reduce((sum, entry) => sum + entry.quantity, 0),
          vendorId: item?.vendor_id || cartItems[0]?.vendor_id,
          vendorName: item?.vendor_name || cartItems[0]?.vendor_name || 'Vendor',
          vendorPhone:
            item?.vendor_whatsapp || cartItems[0]?.vendor_whatsapp || vendorUser?.phone || '',
          clientId: user.id,
          clientName: `${user.first_name} ${user.last_name}`,
          clientEmail: user.email,
          clientPhone: user.phone,
          ambassadorId: ambassadorUser?.id || '',
          ambassadorPhone: ambassadorUser?.phone || '',
          paymentMethod,
          payoutPhone: paymentMethod === 'mpesa' ? mpesaPhone : '',
          payoutBankAccount: paymentMethod === 'bank' ? bankAccount : '',
          payoutBankCode: paymentMethod === 'bank' ? bankCode : '',
          // Delivery info
          deliveryRequested: wantsDelivery,
          deliveryAddress: wantsDelivery ? deliveryAddress : '',
          deliveryRiderId: wantsDelivery ? selectedRiderId : '',
          deliveryRiderName: wantsDelivery ? selectedRider?.name : '',
          deliveryRiderPhone: wantsDelivery ? selectedRider?.phone : '',
          deliveryFee: wantsDelivery ? deliveryFee : 0,
          totalWithDelivery: grandTotal,
          items: cartItems.map((entry) => ({
            id: entry.id,
            name: entry.item_name,
            quantity: entry.quantity,
            price: entry.price_kes,
          })),
        }),
      });

      const data = await res.json();

      if (!data.success || !data.paymentUrl) {
        setError(data.error || 'Failed to initiate payment. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.paymentUrl) {
        clearCart();
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to products
        </button>

        <h1 className="text-2xl font-bold text-card-foreground mb-6">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold text-card-foreground mb-4 uppercase tracking-wide">
                Order Summary
              </h2>
              <div className="space-y-3 mb-4">
                {cartItems.map((cartItem) => (
                  <div
                    key={cartItem.id}
                    className="rounded-xl border border-border bg-muted/70 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-background overflow-hidden shrink-0">
                        {cartItem.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cartItem.images[0]}
                            alt={cartItem.item_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground text-sm leading-snug line-clamp-2">
                          {cartItem.item_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cartItem.vendor_name || cartItem.city}
                        </p>
                        <p className="text-sm font-bold text-primary mt-2">
                          KES {cartItem.price_kes.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-card-foreground font-bold hover:bg-muted transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">
                          {cartItem.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-background flex items-center justify-center text-card-foreground font-bold hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(cartItem.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Split breakdown */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-card-foreground">
                    KES {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Platform fee (10%)</span>
                  <span>KES {split.platformCut.toLocaleString()}</span>
                </div>
                {hasAmbassador && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Ambassador commission (5%)</span>
                    <span>KES {split.ambassadorCut.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Vendor receives</span>
                  <span className="text-green-600 font-semibold">
                    KES {split.vendorPayout.toLocaleString()}
                  </span>
                </div>
                {wantsDelivery && deliveryFee > 0 && (
                  <div className="flex justify-between text-xs text-blue-600">
                    <span className="flex items-center gap-1">
                      <Bike size={11} /> Delivery fee
                    </span>
                    <span className="font-semibold">KES {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-card-foreground">Total</span>
                  <span className="font-extrabold text-primary text-lg">
                    KES {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200">
              <ShieldCheck size={16} className="text-green-600 shrink-0" />
              <p className="text-xs text-green-700">
                Secured by Flutterwave. Vendor & ambassador paid automatically after purchase.
              </p>
            </div>
          </div>

          {/* Payment form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Delivery option */}
              <div className="card p-5">
                <h2 className="text-sm font-bold text-card-foreground mb-3 uppercase tracking-wide">
                  Delivery Option
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setWantsDelivery(false)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      !wantsDelivery
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Package
                      size={22}
                      className={!wantsDelivery ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <span
                      className={`text-sm font-semibold ${!wantsDelivery ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Self Pickup
                    </span>
                    <span className="text-xs text-muted-foreground">Collect from vendor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWantsDelivery(true)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      wantsDelivery
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Bike
                      size={22}
                      className={wantsDelivery ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <span
                      className={`text-sm font-semibold ${wantsDelivery ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Bike Delivery
                    </span>
                    <span className="text-xs text-muted-foreground">Delivered to you</span>
                  </button>
                </div>

                {/* Delivery details */}
                {wantsDelivery && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Westlands, near Total petrol station"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Rider selection */}
                    {availableRiders.length > 0 ? (
                      <div>
                        <label className="block text-sm font-semibold text-card-foreground mb-2">
                          Choose Rider
                        </label>
                        <div className="space-y-2">
                          {availableRiders.map((rider) => {
                            const userLat = user?.location_lat;
                            const userLng = user?.location_lng;
                            let distKm = 3;
                            if (userLat && userLng && item?.location_lat && item?.location_lng) {
                              distKm = haversineKm(
                                item.location_lat,
                                item.location_lng,
                                userLat,
                                userLng
                              );
                            }
                            const fee = calculateDeliveryFee(rider, Math.max(1, distKm));
                            const bikeEmoji =
                              rider.bikeType === 'motorcycle'
                                ? '🏍️'
                                : rider.bikeType === 'bicycle'
                                  ? '🚲'
                                  : '🛺';

                            return (
                              <button
                                key={rider.id}
                                type="button"
                                onClick={() => setSelectedRiderId(rider.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                  selectedRiderId === rider.id
                                    ? 'border-primary bg-accent/40'
                                    : 'border-border hover:border-primary/40'
                                }`}
                              >
                                <span className="text-xl">{bikeEmoji}</span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-semibold ${selectedRiderId === rider.id ? 'text-primary' : 'text-card-foreground'}`}
                                  >
                                    {rider.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ⭐ {rider.rating.toFixed(1)} · {rider.totalDeliveries}{' '}
                                    deliveries · {rider.city}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p
                                    className={`text-sm font-bold ${selectedRiderId === rider.id ? 'text-primary' : 'text-card-foreground'}`}
                                  >
                                    KES {fee.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">est. fee</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                        <AlertCircle size={16} className="text-amber-600 shrink-0" />
                        <p className="text-sm text-amber-700">
                          No riders available in your area right now. Try self-pickup or check back
                          later.
                        </p>
                      </div>
                    )}

                    {!user?.location_lat && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                        <MapPin size={16} className="text-blue-600 shrink-0" />
                        <p className="text-xs text-blue-700">
                          <strong>Tip:</strong> Set your location in the home screen for accurate
                          delivery fee estimates.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div className="card p-5 space-y-5">
                <h2 className="text-sm font-bold text-card-foreground uppercase tracking-wide">
                  Payment Method
                </h2>

                {/* Method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 ${
                      paymentMethod === 'mpesa'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Smartphone
                      size={24}
                      className={
                        paymentMethod === 'mpesa' ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                    <span
                      className={`text-sm font-semibold ${paymentMethod === 'mpesa' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      M-Pesa
                    </span>
                    <span className="text-xs text-muted-foreground">STK Push</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 ${
                      paymentMethod === 'bank'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Building2
                      size={24}
                      className={
                        paymentMethod === 'bank' ? 'text-primary' : 'text-muted-foreground'
                      }
                    />
                    <span
                      className={`text-sm font-semibold ${paymentMethod === 'bank' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      Bank Transfer
                    </span>
                    <span className="text-xs text-muted-foreground">Direct debit</span>
                  </button>
                </div>

                {/* M-Pesa fields */}
                {paymentMethod === 'mpesa' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You will receive an STK push prompt on this number
                      </p>
                    </div>
                  </div>
                )}

                {/* Bank fields */}
                {paymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                        Bank
                      </label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      >
                        {KENYAN_BANKS.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="Enter your account number"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-card-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Customer info (read-only) */}
                <div className="rounded-xl bg-muted p-4 space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Billing Details
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-card-foreground">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-card-foreground">{user.email}</span>
                  </div>
                  {hasAmbassador && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Referred by</span>
                      <span className="font-medium text-amber-600">
                        {ambassadorUser?.first_name} {ambassadorUser?.last_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-4 text-base justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay KES {grandTotal.toLocaleString()}
                      {wantsDelivery && deliveryFee > 0 && (
                        <span className="text-xs opacity-80 ml-1">(incl. delivery)</span>
                      )}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  By paying, you agree to our terms. Vendor & ambassador payouts are automatic.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}

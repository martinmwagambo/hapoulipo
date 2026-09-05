'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import { getOrder, saveOrder, type Order } from '@/lib/paymentConfig';

function OrderConfirmationInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const txRef = searchParams.get('tx_ref');
  const status = searchParams.get('status');
  const transactionId = searchParams.get('transaction_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payoutTriggered, setPayoutTriggered] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  const resolvedOrderId = orderId || txRef;
  const isSuccess = status === 'successful' || status === 'completed';
  const isFailed = status === 'cancelled' || status === 'failed';

  useEffect(() => {
    if (!resolvedOrderId) return;
    const found = getOrder(resolvedOrderId);
    setOrder(found);

    // If payment successful, trigger payout
    if (isSuccess && found && found.status !== 'completed' && !payoutTriggered) {
      setPayoutTriggered(true);
      setIsProcessing(true);

      // Update order status
      const updated = {
        ...found,
        status: 'payment_confirmed' as const,
        updatedAt: new Date().toISOString(),
      };
      saveOrder(updated);
      setOrder(updated);

      fetch('/api/payment/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: resolvedOrderId, transactionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const completed = {
              ...updated,
              status: 'completed' as const,
              updatedAt: new Date().toISOString(),
            };
            saveOrder(completed);
            setOrder(completed);
          } else {
            setPayoutError('Payout is being processed. You will be notified shortly.');
          }
        })
        .catch(() => {
          setPayoutError('Payout queued. Vendor will be paid within 24 hours.');
        })
        .finally(() => setIsProcessing(false));
    }
  }, [resolvedOrderId, isSuccess, transactionId, payoutTriggered]);

  if (!resolvedOrderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid order reference.</p>
          <button onClick={() => router.push('/client-home')} className="btn-primary mt-4">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Status icon */}
        <div className="text-center mb-8">
          {isFailed ? (
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-500" />
            </div>
          ) : isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Loader2 size={40} className="text-amber-500 animate-spin" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-card-foreground">
            {isFailed
              ? 'Payment Failed'
              : isSuccess
                ? 'Payment Successful!'
                : 'Processing Payment...'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isFailed
              ? 'Your payment was not completed. No charges were made.'
              : isSuccess
                ? 'Your order has been confirmed and payouts are being processed.'
                : 'Please wait while we confirm your payment.'}
          </p>
        </div>

        {/* Order details */}
        {order && isSuccess && (
          <div className="card p-5 space-y-4 mb-6">
            <h2 className="text-sm font-bold text-card-foreground uppercase tracking-wide">
              Order Details
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs font-semibold text-card-foreground">
                  {order.orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item</span>
                <span className="font-semibold text-card-foreground text-right max-w-[60%] leading-snug">
                  {order.itemName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-semibold text-card-foreground">{order.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-extrabold text-primary">
                  KES {order.split.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payout breakdown */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                Automatic Payouts
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-card-foreground">
                      Vendor — {order.vendorName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">
                      KES {order.split.vendorPayout.toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {order.paymentMethod === 'bank' ? 'Bank transfer' : 'M-Pesa'}
                    </p>
                  </div>
                </div>

                {order.split.ambassadorCut > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-card-foreground">Ambassador commission</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-600">
                        KES {order.split.ambassadorCut.toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">M-Pesa</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-card-foreground">Platform fee</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">
                    KES {order.split.platformCut.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payout status */}
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                isProcessing
                  ? 'bg-amber-50 text-amber-700'
                  : order.status === 'completed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Processing payouts...
                </>
              ) : order.status === 'completed' ? (
                <>
                  <CheckCircle2 size={14} /> All payouts disbursed successfully
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Payouts queued for processing
                </>
              )}
            </div>

            {payoutError && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                {payoutError}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isFailed ? (
            <button
              onClick={() => router.back()}
              className="btn-primary w-full py-3.5 justify-center"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          ) : (
            <button
              onClick={() => router.push('/client-home')}
              className="btn-primary w-full py-3.5 justify-center"
            >
              <ShoppingBag size={18} />
              Continue Shopping
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <OrderConfirmationInner />
    </Suspense>
  );
}

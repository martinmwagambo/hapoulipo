import { NextRequest, NextResponse } from 'next/server';
import { getOrder, saveOrder } from '@/lib/paymentConfig';

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('verif-hash') || '';
    const rawBody = await req.text();

    // Verify webhook signature
    if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    if (event === 'charge.completed' && data?.status === 'successful') {
      const orderId = data.tx_ref;
      const transactionId = data.id;

      const order = getOrder(orderId);
      if (order && order.status === 'pending_payment') {
        saveOrder({
          ...order,
          status: 'payment_confirmed',
          updatedAt: new Date().toISOString(),
        });

        // Trigger automatic payout
        await fetch(`${SITE_URL}/api/payment/payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, transactionId }),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

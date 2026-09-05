import { NextRequest, NextResponse } from 'next/server';
import { getOrder, saveOrder } from '@/lib/paymentConfig';

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || '';

async function disburseMpesa(phone: string, amount: number, narration: string, reference: string) {
  if (!FLW_SECRET_KEY || FLW_SECRET_KEY === 'your-flutterwave-secret-key-here') {
    console.log(`[MOCK PAYOUT] M-Pesa to ${phone}: KES ${amount} — ${narration}`);
    return { success: true, mock: true };
  }

  const res = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_bank: 'MPS', // M-Pesa Kenya
      account_number: phone.replace(/\D/g, ''),
      amount,
      narration,
      currency: 'KES',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/webhook`,
      debit_currency: 'KES',
    }),
  });

  const data = await res.json();
  return { success: data.status === 'success', data };
}

async function disburseBankTransfer(
  accountNumber: string,
  bankCode: string,
  amount: number,
  narration: string,
  reference: string
) {
  if (!FLW_SECRET_KEY || FLW_SECRET_KEY === 'your-flutterwave-secret-key-here') {
    console.log(
      `[MOCK PAYOUT] Bank to ${accountNumber} (${bankCode}): KES ${amount} — ${narration}`
    );
    return { success: true, mock: true };
  }

  const res = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_bank: bankCode,
      account_number: accountNumber,
      amount,
      narration,
      currency: 'KES',
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/webhook`,
      debit_currency: 'KES',
    }),
  });

  const data = await res.json();
  return { success: data.status === 'success', data };
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, transactionId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Verify transaction with Flutterwave
    if (transactionId && FLW_SECRET_KEY && FLW_SECRET_KEY !== 'your-flutterwave-secret-key-here') {
      const verifyRes = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
        }
      );
      const verifyData = await verifyRes.json();

      if (verifyData.data?.status !== 'successful') {
        return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
      }
    }

    const order = getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'completed') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Update order status
    saveOrder({ ...order, status: 'payout_processing', updatedAt: new Date().toISOString() });

    const results: Record<string, unknown> = {};

    // 1. Vendor payout
    const vendorRef = `VENDOR-${orderId}`;
    if (order.paymentMethod === 'bank' && order.payoutBankAccount && order.payoutBankCode) {
      results.vendor = await disburseBankTransfer(
        order.payoutBankAccount,
        order.payoutBankCode,
        order.split.vendorPayout,
        `Hapo Ulipo sale — ${order.itemName}`,
        vendorRef
      );
    } else {
      const vendorPhone = order.payoutPhone || order.vendorPhone;
      results.vendor = await disburseMpesa(
        vendorPhone,
        order.split.vendorPayout,
        `Hapo Ulipo sale — ${order.itemName}`,
        vendorRef
      );
    }

    // 2. Ambassador payout (if applicable)
    if (order.ambassadorId && order.ambassadorPhone && order.split.ambassadorCut > 0) {
      results.ambassador = await disburseMpesa(
        order.ambassadorPhone,
        order.split.ambassadorCut,
        `Hapo Ulipo commission — ${order.itemName}`,
        `AMB-${orderId}`
      );
    }

    // Platform cut stays in Flutterwave balance (no transfer needed)
    results.platform = { retained: order.split.platformCut, currency: 'KES' };

    saveOrder({ ...order, status: 'completed', updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, orderId, payouts: results });
  } catch (err) {
    console.error('Payout error:', err);
    return NextResponse.json({ error: 'Payout processing failed' }, { status: 500 });
  }
}

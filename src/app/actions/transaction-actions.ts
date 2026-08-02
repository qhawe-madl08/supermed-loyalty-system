'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { recordPurchase, redeemPoints } from '@/services/loyalty/loyalty.service';

export async function recordTransaction(formData: FormData) {
  const customerId = String(formData.get('customer_id') ?? '').trim();
  const type = String(formData.get('transaction_type') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!customerId) throw new Error('Customer is required');

  if (type === 'REDEMPTION') {
    await redeemPoints({
      customer_id: customerId,
      points: Number.parseInt(String(formData.get('points') ?? ''), 10),
      notes,
    });
  } else if (type === 'PURCHASE') {
    await recordPurchase({
      customer_id: customerId,
      amount: Number.parseFloat(String(formData.get('amount') ?? '')),
      notes,
    });
  } else {
    throw new Error('Invalid transaction type');
  }

  revalidatePath(`/workflows/customers/${customerId}`);
  redirect(`/workflows/customers/${customerId}`);
}

'use server';

import { readStore, writeStore } from '@/lib/data-store';
import { createPurchaseTransaction, createRedemptionTransaction } from '@/services/transactions/transaction.repository';
import { redirect } from 'next/navigation';

export async function recordTransaction(formData: FormData) {
  const customerId = String(formData.get('customer_id') ?? '').trim();
  const type = String(formData.get('transaction_type') ?? '').trim() as 'PURCHASE' | 'REDEMPTION';
  const amountStr = String(formData.get('amount') ?? '').trim();
  const pointsStr = String(formData.get('points') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!customerId) throw new Error('Customer ID is required.');

  const store = await readStore();
  const settings = store.settings;

  if (type === 'PURCHASE') {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) throw new Error('A valid purchase amount is required.');
    await createPurchaseTransaction({
      customerId,
      amountUsd: amount,
      multiplier: settings.points_multiplier,
      notes: notes || null,
    });
  } else if (type === 'REDEMPTION') {
    const points = parseInt(pointsStr, 10);
    if (isNaN(points) || points <= 0) throw new Error('A valid points amount is required.');
    await createRedemptionTransaction({
      customerId,
      points,
      notes: notes || null,
    });
  } else {
    throw new Error('Invalid transaction type.');
  }

  redirect('/workflows');
}

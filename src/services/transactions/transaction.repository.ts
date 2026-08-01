import { readStore, writeStore } from '@/lib/data-store';
import type { TransactionRecord } from '@/types';
import { calculatePointsForPurchase } from '@/services/loyalty/points.service';

export async function createPurchaseTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  amountUsd: number;
  multiplier: number;
  balanceBefore: number;
  notes?: string | null;
}): Promise<TransactionRecord> {
  const pointsEarned = calculatePointsForPurchase(input.amountUsd, input.multiplier);
  const balanceAfter = input.balanceBefore + pointsEarned;
  const store = await readStore();
  const transaction: TransactionRecord = {
    id: `txn-${Math.random().toString(36).slice(2, 10)}`,
    customer_id: input.customerId,
    cashier_id: input.cashierId ?? null,
    transaction_type: 'PURCHASE',
    purchase_amount: input.amountUsd,
    points: pointsEarned,
    balance_before: input.balanceBefore,
    balance_after: balanceAfter,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  await writeStore(store);
  return transaction;
}

export async function createRedemptionTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  points: number;
  balanceBefore: number;
  notes?: string | null;
}): Promise<TransactionRecord> {
  const balanceAfter = Math.max(0, input.balanceBefore - input.points);
  const store = await readStore();
  const transaction: TransactionRecord = {
    id: `txn-${Math.random().toString(36).slice(2, 10)}`,
    customer_id: input.customerId,
    cashier_id: input.cashierId ?? null,
    transaction_type: 'REDEMPTION',
    purchase_amount: null,
    points: -Math.abs(input.points),
    balance_before: input.balanceBefore,
    balance_after: balanceAfter,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  await writeStore(store);
  return transaction;
}

export async function listTransactions(): Promise<TransactionRecord[]> {
  const store = await readStore();
  return store.transactions;
}

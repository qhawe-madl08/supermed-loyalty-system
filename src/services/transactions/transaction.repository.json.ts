import { readStore, writeStore } from '@/lib/data-store';
import type { LegacyTransactionRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { updateCustomerBalance } from '@/services/customer/customer.repository.json';
import { logAuditEvent, AuditActions } from '@/lib/audit-logger';

export async function createPurchaseTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  amountUsd: number;
  multiplier: number;
  notes?: string | null;
}): Promise<LegacyTransactionRecord> {
  const store = await readStore();
  const customer = store.customers.find(c => c.id === input.customerId);
  
  if (!customer) {
    throw new Error('CUSTOMER_NOT_FOUND');
  }

  const { calculatePointsForPurchase } = await import('@/services/loyalty/points.service');
  const pointsEarned = calculatePointsForPurchase(input.amountUsd, input.multiplier);
  const balanceBefore = customer.points_balance;
  const balanceAfter = balanceBefore + pointsEarned;

  const transaction: LegacyTransactionRecord = {
    id: `txn-${uuidv4()}`,
    customer_id: input.customerId,
    cashier_id: input.cashierId ?? null,
    transaction_type: 'PURCHASE',
    purchase_amount: input.amountUsd,
    points: pointsEarned,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  await writeStore(store);

  // Log audit event
  await logAuditEvent({
    action: AuditActions.PURCHASE_RECORDED,
    entity_type: 'transaction',
    entity_id: transaction.id,
    metadata: {
      customer_id: input.customerId,
      amount: input.amountUsd,
      points: pointsEarned,
      previous_balance: balanceBefore,
      new_balance: balanceAfter,
    },
  });

  return transaction;
}

export async function createRedemptionTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  points: number;
  notes?: string | null;
}): Promise<LegacyTransactionRecord> {
  const store = await readStore();
  const customer = store.customers.find(c => c.id === input.customerId);
  
  if (!customer) {
    throw new Error('CUSTOMER_NOT_FOUND');
  }

  if (customer.points_balance < input.points) {
    throw new Error('INSUFFICIENT_POINTS');
  }

  const balanceBefore = customer.points_balance;
  const balanceAfter = balanceBefore - input.points;

  const transaction: LegacyTransactionRecord = {
    id: `txn-${uuidv4()}`,
    customer_id: input.customerId,
    cashier_id: input.cashierId ?? null,
    transaction_type: 'REDEMPTION',
    purchase_amount: null,
    points: -Math.abs(input.points),
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };

  store.transactions.push(transaction);
  await writeStore(store);

  // Log audit event
  await logAuditEvent({
    action: AuditActions.REDEMPTION_RECORDED,
    entity_type: 'transaction',
    entity_id: transaction.id,
    metadata: {
      customer_id: input.customerId,
      points: input.points,
      previous_balance: balanceBefore,
      new_balance: balanceAfter,
    },
  });

  return transaction;
}

export async function listTransactions(): Promise<LegacyTransactionRecord[]> {
  const store = await readStore();
  return store.transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getCustomerTransactions(customerId: string): Promise<LegacyTransactionRecord[]> {
  const store = await readStore();
  return store.transactions
    .filter(t => t.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

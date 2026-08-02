import { supabaseAdmin } from '@/lib/supabase-admin';
import type { TransactionRecord, LegacyTransactionRecord } from '@/types';
import { calculatePointsForPurchase } from '@/services/loyalty/points.service';
import { v4 as uuidv4 } from 'uuid';

function getTenantId(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
}

function getStaffId(): string | null {
  // In a real app, this would come from the authenticated user's session
  return null;
}

function toLegacyTransaction(txn: TransactionRecord): LegacyTransactionRecord {
  return {
    id: txn.id,
    customer_id: txn.customer_id,
    cashier_id: txn.staff_id,
    transaction_type: mapTxnType(txn.txn_type),
    purchase_amount: txn.amount,
    points: txn.points,
    balance_before: 0, // Would need to calculate from ledger
    balance_after: 0,  // Would need to calculate from ledger
    notes: txn.reason,
    created_at: txn.created_at,
  };
}

function mapTxnType(type: TransactionRecord['txn_type']): LegacyTransactionRecord['transaction_type'] {
  switch (type) {
    case 'earn':
      return 'PURCHASE';
    case 'redeem':
      return 'REDEMPTION';
    case 'adjustment':
    case 'expiry':
    case 'refund_reversal':
      return 'MANUAL_ADJUSTMENT';
    default:
      return 'PURCHASE';
  }
}

export async function createPurchaseTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  amountUsd: number;
  multiplier: number;
  notes?: string | null;
}): Promise<LegacyTransactionRecord> {
  const tenantId = getTenantId();
  const staffId = getStaffId();
  const pointsEarned = calculatePointsForPurchase(input.amountUsd, input.multiplier);
  const idempotencyKey = uuidv4();

  const { data, error } = await supabaseAdmin
    .from('points_ledger')
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      branch_id: null,
      staff_id: staffId,
      txn_type: 'earn',
      points: pointsEarned,
      currency: 'USD',
      amount: input.amountUsd,
      reason: input.notes ?? null,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create purchase transaction: ${error.message}`);
  }

  return toLegacyTransaction(data);
}

export async function createRedemptionTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  points: number;
  notes?: string | null;
}): Promise<LegacyTransactionRecord> {
  const tenantId = getTenantId();
  const staffId = getStaffId();
  const idempotencyKey = uuidv4();

  const { data, error } = await supabaseAdmin
    .from('points_ledger')
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      branch_id: null,
      staff_id: staffId,
      txn_type: 'redeem',
      points: -Math.abs(input.points),
      currency: null,
      amount: null,
      reason: input.notes ?? null,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create redemption transaction: ${error.message}`);
  }

  return toLegacyTransaction(data);
}

export async function listTransactions(): Promise<LegacyTransactionRecord[]> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('points_ledger')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list transactions: ${error.message}`);
  }

  return (data ?? []).map(toLegacyTransaction);
}

export async function getCustomerTransactions(customerId: string): Promise<LegacyTransactionRecord[]> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('points_ledger')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get customer transactions: ${error.message}`);
  }

  return (data ?? []).map(toLegacyTransaction);
}

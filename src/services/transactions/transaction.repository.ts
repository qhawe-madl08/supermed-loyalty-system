import { createSupabaseServerClient } from '@/lib/auth';
import type { TransactionRecord, LegacyTransactionRecord } from '@/types';
import { calculatePointsForPurchase } from '@/services/loyalty/points.service';
import { getDefaultTenantId } from '@/lib/tenant-helper';
import { getUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

async function getAuthenticatedStaffId(): Promise<string | null> {
  try {
    const user = await getUser();
    if (!user) return null;
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from('staff_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function getCustomerBalanceSnapshot(
  customerId: string
): Promise<{ before: number; after: number }> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('customers')
    .select('points_balance')
    .eq('id', customerId)
    .single();
  return { before: data?.points_balance ?? 0, after: 0 };
}

function toLegacyTransaction(
  txn: TransactionRecord,
  balanceBefore: number,
  balanceAfter: number
): LegacyTransactionRecord {
  return {
    id: txn.id,
    customer_id: txn.customer_id,
    cashier_id: txn.staff_id,
    transaction_type: mapTxnType(txn.txn_type),
    purchase_amount: txn.amount,
    points: txn.points,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
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
  const tenantId = await getDefaultTenantId();
  const staffId = input.cashierId ?? await getAuthenticatedStaffId();
  const pointsEarned = calculatePointsForPurchase(input.amountUsd, input.multiplier);
  const idempotencyKey = uuidv4();

  const { before } = await getCustomerBalanceSnapshot(input.customerId);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
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

  return toLegacyTransaction(data, before, before + pointsEarned);
}

export async function createRedemptionTransaction(input: {
  customerId: string;
  cashierId?: string | null;
  points: number;
  notes?: string | null;
}): Promise<LegacyTransactionRecord> {
  const tenantId = await getDefaultTenantId();
  const staffId = input.cashierId ?? await getAuthenticatedStaffId();
  const idempotencyKey = uuidv4();
  const pointsDeducted = Math.abs(input.points);

  const { before } = await getCustomerBalanceSnapshot(input.customerId);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('points_ledger')
    .insert({
      tenant_id: tenantId,
      customer_id: input.customerId,
      branch_id: null,
      staff_id: staffId,
      txn_type: 'redeem',
      points: -pointsDeducted,
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

  return toLegacyTransaction(data, before, Math.max(0, before - pointsDeducted));
}

export async function listTransactions(): Promise<LegacyTransactionRecord[]> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list transactions: ${error.message}`);
  }

  return (data ?? []).map((txn) => toLegacyTransaction(txn, 0, 0));
}

export async function getCustomerTransactions(customerId: string): Promise<LegacyTransactionRecord[]> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get customer transactions: ${error.message}`);
  }

  // Rebuild running balance from the ordered ledger (oldest first for accuracy)
  const rows = [...(data ?? [])].reverse();
  let running = 0;
  const mapped: LegacyTransactionRecord[] = rows.map((txn) => {
    const before = running;
    running = Math.max(0, running + txn.points);
    return toLegacyTransaction(txn, before, running);
  });
  return mapped.reverse();
}

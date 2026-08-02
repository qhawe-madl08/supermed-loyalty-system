import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { LoyaltyRepository } from '@/lib/db/repository';
import type {
  Card,
  CardStatus,
  Customer,
  NewCustomerInput,
  PurchaseInput,
  RedemptionInput,
  Settings,
  Transaction,
} from '@/types';

interface CustomerRow {
  id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  points_balance: number;
  created_at: string;
  loyalty_cards?: { id: string; status: string }[];
}

interface CardRow {
  id: string;
  card_code: string;
  status: string;
  customer_id: string | null;
  created_at: string;
}

interface LedgerRow {
  id: string;
  customer_id: string;
  branch_id: string | null;
  staff_id: string | null;
  txn_type: string;
  points: number;
  amount: number | string | null;
  reason: string | null;
  created_at: string;
}

const CUSTOMER_SELECT = 'id, full_name, phone_e164, email, points_balance, created_at, loyalty_cards(id, status)';

export function tenantId(): string {
  const value = process.env.SUPERMED_TENANT_ID;
  if (!value) {
    throw new Error('SUPERMED_TENANT_ID is not set. It must match the tenant row created by supabase/seed.sql.');
  }
  return value;
}

function toCustomer(row: CustomerRow): Customer {
  const [firstName, ...rest] = row.full_name.trim().split(' ');
  const assignedCard = (row.loyalty_cards ?? []).find((card) => card.status === 'assigned');

  return {
    id: row.id,
    first_name: firstName ?? '',
    last_name: rest.join(' '),
    phone: row.phone_e164,
    email: row.email,
    points_balance: row.points_balance,
    card_id: assignedCard?.id ?? null,
    created_at: row.created_at,
  };
}

function toCard(row: CardRow): Card {
  const status: CardStatus =
    row.status === 'assigned' ? 'ASSIGNED' : row.status === 'available' ? 'AVAILABLE' : 'DISABLED';

  return {
    id: row.id,
    card_number: row.card_code,
    status,
    customer_id: row.customer_id,
    created_at: row.created_at,
  };
}

function toTransaction(row: LedgerRow, balanceAfter = 0): Transaction {
  return {
    id: row.id,
    customer_id: row.customer_id,
    branch_id: row.branch_id,
    staff_id: row.staff_id,
    transaction_type:
      row.txn_type === 'earn' ? 'PURCHASE' : row.txn_type === 'redeem' ? 'REDEMPTION' : 'ADJUSTMENT',
    purchase_amount: row.amount === null ? null : Number(row.amount),
    points: row.points,
    balance_after: balanceAfter,
    notes: row.reason,
    created_at: row.created_at,
  };
}

function withRunningBalances(rows: LedgerRow[]): Transaction[] {
  // rows arrive newest first; walk oldest first to build the running balance
  const oldestFirst = [...rows].reverse();
  const balances = new Map<string, number>();

  const withBalance = oldestFirst.map((row) => {
    const balance = (balances.get(row.customer_id) ?? 0) + row.points;
    balances.set(row.customer_id, balance);
    return toTransaction(row, balance);
  });

  return withBalance.reverse();
}

function fail(action: string, message: string): never {
  throw new Error(`${action}: ${message}`);
}

export const supabaseRepository: LoyaltyRepository = {
  async getSettings(): Promise<Settings> {
    const { data, error } = await getSupabaseAdmin()
      .from('app_settings')
      .select('points_multiplier, currency')
      .eq('tenant_id', tenantId())
      .maybeSingle();

    if (error) fail('Failed to load settings', error.message);

    return {
      points_multiplier: data ? Number(data.points_multiplier) : 1,
      currency: data?.currency ?? 'USD',
    };
  },

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const next = { ...current, ...patch };

    const { error } = await getSupabaseAdmin()
      .from('app_settings')
      .upsert(
        {
          tenant_id: tenantId(),
          points_multiplier: next.points_multiplier,
          currency: next.currency,
        },
        { onConflict: 'tenant_id' }
      );

    if (error) fail('Failed to update settings', error.message);
    return next;
  },

  async listCards(): Promise<Card[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('loyalty_cards')
      .select('id, card_code, status, customer_id, created_at')
      .eq('tenant_id', tenantId())
      .order('card_code');

    if (error) fail('Failed to list cards', error.message);
    return (data as CardRow[]).map(toCard);
  },

  async createCards(cardNumbers: string[]): Promise<Card[]> {
    const rows = cardNumbers.map((cardNumber) => ({
      tenant_id: tenantId(),
      card_code: cardNumber,
      card_type: 'barcode' as const,
      status: 'available' as const,
      customer_id: null,
    }));

    const { data, error } = await getSupabaseAdmin()
      .from('loyalty_cards')
      .upsert(rows, { onConflict: 'tenant_id,card_code', ignoreDuplicates: true })
      .select('id, card_code, status, customer_id, created_at');

    if (error) fail('Failed to create cards', error.message);
    return (data as CardRow[]).map(toCard);
  },

  async getCardByNumber(cardNumber: string): Promise<Card | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('loyalty_cards')
      .select('id, card_code, status, customer_id, created_at')
      .eq('tenant_id', tenantId())
      .eq('card_code', cardNumber)
      .maybeSingle();

    if (error) fail('Failed to find card', error.message);
    return data ? toCard(data as CardRow) : null;
  },

  async assignCard(cardId: string, customerId: string): Promise<Card> {
    const { data, error } = await getSupabaseAdmin()
      .from('loyalty_cards')
      .update({ customer_id: customerId, status: 'assigned' })
      .eq('tenant_id', tenantId())
      .eq('id', cardId)
      .in('status', ['available', 'assigned'])
      .select('id, card_code, status, customer_id, created_at')
      .maybeSingle();

    if (error) fail('Failed to assign card', error.message);
    if (!data) throw new Error('Card is not available for assignment');
    return toCard(data as CardRow);
  },

  async setCardStatus(cardId: string, status: CardStatus): Promise<Card> {
    const dbStatus = status === 'ASSIGNED' ? 'assigned' : status === 'AVAILABLE' ? 'available' : 'disabled';

    const { data, error } = await getSupabaseAdmin()
      .from('loyalty_cards')
      .update({
        status: dbStatus,
        ...(status === 'ASSIGNED' ? {} : { customer_id: null }),
      })
      .eq('tenant_id', tenantId())
      .eq('id', cardId)
      .select('id, card_code, status, customer_id, created_at')
      .single();

    if (error) fail('Failed to update card status', error.message);
    return toCard(data as CardRow);
  },

  async listCustomers(): Promise<Customer[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select(CUSTOMER_SELECT)
      .eq('tenant_id', tenantId())
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) fail('Failed to list customers', error.message);
    return (data as CustomerRow[]).map(toCustomer);
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select(CUSTOMER_SELECT)
      .eq('tenant_id', tenantId())
      .eq('id', customerId)
      .maybeSingle();

    if (error) fail('Failed to load customer', error.message);
    return data ? toCustomer(data as CustomerRow) : null;
  },

  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select(CUSTOMER_SELECT)
      .eq('tenant_id', tenantId())
      .eq('phone_e164', phone)
      .maybeSingle();

    if (error) fail('Failed to find customer', error.message);
    return data ? toCustomer(data as CustomerRow) : null;
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const term = query.trim();
    if (!term) return [];

    const card = await this.getCardByNumber(term);
    if (card?.customer_id) {
      const customer = await this.getCustomer(card.customer_id);
      if (customer) return [customer];
    }

    const pattern = `%${term}%`;
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .select(CUSTOMER_SELECT)
      .eq('tenant_id', tenantId())
      .eq('is_active', true)
      .or(`full_name.ilike.${pattern},phone_e164.ilike.${pattern},email.ilike.${pattern}`)
      .order('full_name')
      .limit(25);

    if (error) fail('Failed to search customers', error.message);
    return (data as CustomerRow[]).map(toCustomer);
  },

  async createCustomer(input: NewCustomerInput): Promise<Customer> {
    const { data, error } = await getSupabaseAdmin()
      .from('customers')
      .insert({
        tenant_id: tenantId(),
        full_name: `${input.first_name} ${input.last_name}`.trim(),
        phone_e164: input.phone,
        email: input.email ?? null,
        preferred_channel: 'whatsapp',
        is_active: true,
      })
      .select(CUSTOMER_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('A customer with this phone number already exists');
      fail('Failed to create customer', error.message);
    }

    const customer = toCustomer(data as CustomerRow);

    if (input.card_id) {
      const card = await this.assignCard(input.card_id, customer.id);
      customer.card_id = card.id;
    }

    return customer;
  },

  async listTransactions(limit?: number): Promise<Transaction[]> {
    let query = getSupabaseAdmin()
      .from('points_ledger')
      .select('id, customer_id, branch_id, staff_id, txn_type, points, amount, reason, created_at')
      .eq('tenant_id', tenantId())
      .order('created_at', { ascending: false });

    if (typeof limit === 'number') query = query.limit(limit);

    const { data, error } = await query;
    if (error) fail('Failed to list transactions', error.message);
    return (data as LedgerRow[]).map((row) => toTransaction(row));
  },

  async listCustomerTransactions(customerId: string): Promise<Transaction[]> {
    const { data, error } = await getSupabaseAdmin()
      .from('points_ledger')
      .select('id, customer_id, branch_id, staff_id, txn_type, points, amount, reason, created_at')
      .eq('tenant_id', tenantId())
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) fail('Failed to load customer transactions', error.message);
    return withRunningBalances(data as LedgerRow[]);
  },

  async recordPurchase(input: PurchaseInput & { points: number }): Promise<Transaction> {
    const { data, error } = await getSupabaseAdmin()
      .from('points_ledger')
      .insert({
        tenant_id: tenantId(),
        customer_id: input.customer_id,
        branch_id: input.branch_id ?? null,
        staff_id: input.staff_id ?? null,
        txn_type: 'earn',
        points: input.points,
        currency: 'USD',
        amount: input.amount,
        reason: input.notes ?? null,
        idempotency_key: randomUUID(),
      })
      .select('id, customer_id, branch_id, staff_id, txn_type, points, amount, reason, created_at')
      .single();

    if (error) fail('Failed to record purchase', error.message);

    const customer = await this.getCustomer(input.customer_id);
    return toTransaction(data as LedgerRow, customer?.points_balance ?? 0);
  },

  async recordRedemption(input: RedemptionInput): Promise<Transaction> {
    const points = Math.abs(input.points);
    const customer = await this.getCustomer(input.customer_id);

    if (!customer) throw new Error('Customer not found');
    if (points > customer.points_balance) throw new Error('Insufficient points balance');

    const { data, error } = await getSupabaseAdmin()
      .from('points_ledger')
      .insert({
        tenant_id: tenantId(),
        customer_id: input.customer_id,
        branch_id: input.branch_id ?? null,
        staff_id: input.staff_id ?? null,
        txn_type: 'redeem',
        points: -points,
        reason: input.notes ?? null,
        idempotency_key: randomUUID(),
      })
      .select('id, customer_id, branch_id, staff_id, txn_type, points, amount, reason, created_at')
      .single();

    if (error) fail('Failed to record redemption', error.message);
    return toTransaction(data as LedgerRow, customer.points_balance - points);
  },
};

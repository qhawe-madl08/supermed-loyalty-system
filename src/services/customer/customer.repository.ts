import { createSupabaseServerClient } from '@/lib/auth';
import type { CustomerRecord, LegacyCustomerRecord } from '@/types';
import { getDefaultTenantId } from '@/lib/tenant-helper';

function toLegacyCustomer(
  customer: CustomerRecord,
  cardId: string | null = null
): LegacyCustomerRecord {
  const nameParts = customer.full_name.trim().split(' ');
  return {
    id: customer.id,
    first_name: nameParts[0] ?? '',
    last_name: nameParts.slice(1).join(' ') || '',
    phone: customer.phone_e164,
    email: customer.email,
    points_balance: customer.points_balance,
    card_id: cardId,
    created_at: customer.created_at,
  };
}

export async function createCustomer(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
}): Promise<LegacyCustomerRecord> {
  const tenantId = await getDefaultTenantId();
  const fullName = `${input.first_name} ${input.last_name}`.trim();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      full_name: fullName,
      phone_e164: input.phone,
      email: input.email ?? null,
      preferred_channel: 'whatsapp',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('DUPLICATE_PHONE');
    }
    throw new Error(`Failed to create customer: ${error.message}`);
  }

  return toLegacyCustomer(data, null);
}

export async function listCustomers(): Promise<LegacyCustomerRecord[]> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*, loyalty_cards!loyalty_cards_customer_id_fkey(id, status)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list customers: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const activeCard = (row.loyalty_cards as Array<{ id: string; status: string }> | null)
      ?.find((c) => c.status === 'active') ?? null;
    const { loyalty_cards: _, ...customer } = row;
    return toLegacyCustomer(customer as CustomerRecord, activeCard?.id ?? null);
  });
}

export async function findCustomerByPhone(phone: string): Promise<LegacyCustomerRecord | undefined> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*, loyalty_cards!loyalty_cards_customer_id_fkey(id, status)')
    .eq('tenant_id', tenantId)
    .eq('phone_e164', phone)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find customer: ${error.message}`);
  }

  if (!data) return undefined;

  const activeCard = (data.loyalty_cards as Array<{ id: string; status: string }> | null)
    ?.find((c) => c.status === 'active') ?? null;
  const { loyalty_cards: _, ...customer } = data;
  return toLegacyCustomer(customer as CustomerRecord, activeCard?.id ?? null);
}

export async function getCurrentCustomerBalance(customerId: string): Promise<number> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('points_balance')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Customer not found');
    }
    throw new Error(`Failed to get balance: ${error.message}`);
  }

  return data.points_balance;
}

export async function getCustomerById(customerId: string): Promise<LegacyCustomerRecord | null> {
  const tenantId = await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*, loyalty_cards!loyalty_cards_customer_id_fkey(id, status)')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get customer: ${error.message}`);
  }

  if (!data) return null;

  const activeCard = (data.loyalty_cards as Array<{ id: string; status: string }> | null)
    ?.find((c) => c.status === 'active') ?? null;
  const { loyalty_cards: _, ...customer } = data;
  return toLegacyCustomer(customer as CustomerRecord, activeCard?.id ?? null);
}

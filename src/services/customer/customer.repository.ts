import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CustomerRecord, LegacyCustomerRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function getTenantId(): string {
  // In a real app, this would come from the authenticated user's JWT claims
  // For MVP, we'll use a default tenant ID or read from env
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
}

function toLegacyCustomer(customer: CustomerRecord): LegacyCustomerRecord {
  const nameParts = customer.full_name.trim().split(' ');
  return {
    id: customer.id,
    first_name: nameParts[0] ?? '',
    last_name: nameParts.slice(1).join(' ') || '',
    phone: customer.phone_e164,
    email: customer.email,
    points_balance: customer.points_balance,
    card_id: null, // Would need to fetch from loyalty_cards table
    created_at: customer.created_at,
  };
}

export async function createCustomer(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  card_id?: string | null;
}): Promise<LegacyCustomerRecord> {
  const tenantId = getTenantId();
  const fullName = `${input.first_name} ${input.last_name}`.trim();

  const { data, error } = await supabaseAdmin
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
    throw new Error(`Failed to create customer: ${error.message}`);
  }

  return toLegacyCustomer(data);
}

export async function listCustomers(): Promise<LegacyCustomerRecord[]> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list customers: ${error.message}`);
  }

  return (data ?? []).map(toLegacyCustomer);
}

export async function findCustomerByPhone(phone: string): Promise<LegacyCustomerRecord | undefined> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone_e164', phone)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find customer: ${error.message}`);
  }

  return data ? toLegacyCustomer(data) : undefined;
}

export async function getCurrentCustomerBalance(customerId: string): Promise<number> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
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
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get customer: ${error.message}`);
  }

  return data ? toLegacyCustomer(data) : null;
}

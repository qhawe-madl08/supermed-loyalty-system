import { createSupabaseServerClient } from '@/lib/auth';
import type { CardRecord, LegacyCardRecord } from '@/types';
import { getAuthenticatedTenantId, getDefaultTenantId } from '@/lib/tenant-helper';
import { v4 as uuidv4 } from 'uuid';

function toLegacyCard(card: CardRecord): LegacyCardRecord {
  return {
    id: card.id,
    card_number: card.card_code,
    status: mapCardStatus(card.status),
    assigned_customer_id: card.customer_id,
    created_at: card.created_at,
  };
}

function mapCardStatus(status: CardRecord['status']): LegacyCardRecord['status'] {
  switch (status) {
    case 'available':
      return 'AVAILABLE';
    case 'active':
      return 'ASSIGNED';
    case 'lost':
      return 'LOST';
    case 'frozen':
      return 'DISABLED';
    case 'replaced':
      return 'REPLACED';
    case 'revoked':
      return 'DISABLED';
    default:
      return 'AVAILABLE';
  }
}

function mapLegacyStatus(status: LegacyCardRecord['status']): CardRecord['status'] {
  switch (status) {
    case 'AVAILABLE':
      return 'active';
    case 'ASSIGNED':
      return 'active';
    case 'LOST':
      return 'lost';
    case 'REPLACED':
      return 'replaced';
    case 'DISABLED':
      return 'revoked';
    default:
      return 'active';
  }
}

/**
 * Creates a new card in inventory with status='available' and no customer assigned.
 * Used for physical card inventory management before customer registration.
 */
export async function createInventoryCard(cardCode: string): Promise<LegacyCardRecord> {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) {
    throw new Error('Authentication required: could not determine tenant_id from session');
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .insert({
      tenant_id: tenantId,
      customer_id: null,
      card_code: cardCode,
      card_type: 'qr',
      status: 'available',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create inventory card: ${error.message}`);
  }

  return toLegacyCard(data);
}

/**
 * Issues a new loyalty card and immediately assigns it to a customer.
 * Legacy function for backwards compatibility - now uses assignAvailableCard internally.
 */
export async function issueCard(customerId: string, cardNumber?: string): Promise<LegacyCardRecord> {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) {
    throw new Error('Authentication required: could not determine tenant_id from session');
  }
  const cardCode = cardNumber ?? uuidv4();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .insert({
      tenant_id: tenantId,
      customer_id: customerId,
      card_code: cardCode,
      card_type: 'qr',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to issue card: ${error.message}`);
  }

  return toLegacyCard(data);
}

/**
 * Finds a card by its card_code (QR payload).
 * Used in scan-first workflow to validate scanned cards.
 */
export async function findCardByCode(cardCode: string): Promise<LegacyCardRecord | null> {
  const tenantId = await getAuthenticatedTenantId() || await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('card_code', cardCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find card: ${error.message}`);
  }

  return data ? toLegacyCard(data) : null;
}

/**
 * Assigns an available card to a customer, transitioning it to active status.
 * Used in scan-first registration workflow.
 */
export async function assignAvailableCard(cardId: string, customerId: string): Promise<LegacyCardRecord> {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) {
    throw new Error('Authentication required: could not determine tenant_id from session');
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .update({
      customer_id: customerId,
      status: 'active',
    })
    .eq('tenant_id', tenantId)
    .eq('id', cardId)
    .eq('status', 'available')
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign available card: ${error.message}`);
  }

  return toLegacyCard(data);
}

export async function listCards(): Promise<LegacyCardRecord[]> {
  const tenantId = await getAuthenticatedTenantId() || await getDefaultTenantId();

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list cards: ${error.message}`);
  }

  return (data ?? []).map(toLegacyCard);
}

export async function assignCard(cardId: string, customerId: string): Promise<LegacyCardRecord> {
  const tenantId = await getAuthenticatedTenantId() || await getDefaultTenantId();

  // Verify card is not already assigned to a different customer
  const supabase = createSupabaseServerClient();
  const { data: existing, error: lookupErr } = await supabase
    .from('loyalty_cards')
    .select('customer_id, status')
    .eq('tenant_id', tenantId)
    .eq('id', cardId)
    .single();

  if (lookupErr) {
    throw new Error(`Card not found: ${lookupErr.message}`);
  }

  if (existing.customer_id && existing.customer_id !== customerId && existing.status === 'active') {
    throw new Error('CARD_ALREADY_ASSIGNED');
  }

  const { data, error } = await supabase
    .from('loyalty_cards')
    .update({
      customer_id: customerId,
      status: 'active',
    })
    .eq('tenant_id', tenantId)
    .eq('id', cardId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign card: ${error.message}`);
  }

  return toLegacyCard(data);
}

export async function updateCardStatus(cardId: string, status: LegacyCardRecord['status']): Promise<LegacyCardRecord> {
  const tenantId = await getAuthenticatedTenantId() || await getDefaultTenantId();
  const mappedStatus = mapLegacyStatus(status);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('loyalty_cards')
    .update({
      status: mappedStatus,
    })
    .eq('tenant_id', tenantId)
    .eq('id', cardId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update card status: ${error.message}`);
  }

  return toLegacyCard(data);
}

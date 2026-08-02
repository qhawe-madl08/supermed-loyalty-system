import { supabaseAdmin } from '@/lib/supabase-admin';
import type { CardRecord, LegacyCardRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';

function getTenantId(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
}

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

export async function registerCard(cardNumber: string): Promise<LegacyCardRecord> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from('loyalty_cards')
    .insert({
      tenant_id: tenantId,
      customer_id: '00000000-0000-0000-0000-000000000000', // placeholder, will be updated on assign
      card_code: cardNumber,
      card_type: 'qr',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to register card: ${error.message}`);
  }

  return toLegacyCard(data);
}

export async function bulkRegisterCards(cardNumbers: string[]): Promise<LegacyCardRecord[]> {
  const cards: LegacyCardRecord[] = [];
  for (const cardNumber of cardNumbers) {
    cards.push(await registerCard(cardNumber));
  }
  return cards;
}

export async function listCards(): Promise<LegacyCardRecord[]> {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
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
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
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
  const tenantId = getTenantId();
  const mappedStatus = mapLegacyStatus(status);

  const { data, error } = await supabaseAdmin
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

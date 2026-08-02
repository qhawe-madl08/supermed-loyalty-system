import { LegacyCardRecord } from '@/types';

export function registerCard(cardNumber: string): LegacyCardRecord {
  return {
    id: `card-${Math.random().toString(36).slice(2, 10)}`,
    card_number: cardNumber,
    status: 'AVAILABLE',
    assigned_customer_id: null,
    created_at: new Date().toISOString(),
  };
}

export function assignCard(card: LegacyCardRecord, customerId: string): LegacyCardRecord {
  return {
    ...card,
    status: 'ASSIGNED',
    assigned_customer_id: customerId,
  };
}

export function updateCardStatus(card: LegacyCardRecord, status: LegacyCardRecord['status']): LegacyCardRecord {
  return {
    ...card,
    status,
  };
}

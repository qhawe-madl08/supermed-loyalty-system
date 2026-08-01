import { CardRecord } from '@/types';

export function registerCard(cardNumber: string): CardRecord {
  return {
    id: `card-${Math.random().toString(36).slice(2, 10)}`,
    card_number: cardNumber,
    status: 'AVAILABLE',
    assigned_customer_id: null,
    created_at: new Date().toISOString(),
  };
}

export function assignCard(card: CardRecord, customerId: string): CardRecord {
  return {
    ...card,
    status: 'ASSIGNED',
    assigned_customer_id: customerId,
  };
}

export function updateCardStatus(card: CardRecord, status: CardRecord['status']): CardRecord {
  return {
    ...card,
    status,
  };
}

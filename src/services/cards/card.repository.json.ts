import { readStore, writeStore } from '@/lib/data-store';
import type { LegacyCardRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { logAuditEvent, AuditActions } from '@/lib/audit-logger';

export async function registerCard(cardNumber: string): Promise<LegacyCardRecord> {
  const store = await readStore();

  const card: LegacyCardRecord = {
    id: `card-${uuidv4()}`,
    card_number: cardNumber,
    status: 'AVAILABLE',
    assigned_customer_id: null,
    created_at: new Date().toISOString(),
  };

  store.cards.push(card);
  await writeStore(store);

  return card;
}

export async function bulkRegisterCards(cardNumbers: string[]): Promise<LegacyCardRecord[]> {
  const store = await readStore();
  const cards: LegacyCardRecord[] = [];

  for (const cardNumber of cardNumbers) {
    const card: LegacyCardRecord = {
      id: `card-${uuidv4()}`,
      card_number: cardNumber,
      status: 'AVAILABLE',
      assigned_customer_id: null,
      created_at: new Date().toISOString(),
    };
    cards.push(card);
    store.cards.push(card);
  }

  await writeStore(store);
  return cards;
}

export async function listCards(): Promise<LegacyCardRecord[]> {
  const store = await readStore();
  return store.cards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function assignCard(cardId: string, customerId: string): Promise<LegacyCardRecord> {
  const store = await readStore();
  const cardIndex = store.cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    throw new Error('CARD_NOT_FOUND');
  }

  const card = store.cards[cardIndex];
  
  if (card.status === 'ASSIGNED' || card.assigned_customer_id) {
    throw new Error('CARD_ALREADY_ASSIGNED');
  }

  store.cards[cardIndex].status = 'ASSIGNED';
  store.cards[cardIndex].assigned_customer_id = customerId;
  await writeStore(store);

  // Log audit event
  await logAuditEvent({
    action: AuditActions.CARD_ASSIGNED,
    entity_type: 'card',
    entity_id: cardId,
    metadata: {
      customer_id: customerId,
      card_number: card.card_number,
    },
  });

  return store.cards[cardIndex];
}

export async function updateCardStatus(cardId: string, status: LegacyCardRecord['status']): Promise<LegacyCardRecord> {
  const store = await readStore();
  const cardIndex = store.cards.findIndex(c => c.id === cardId);
  
  if (cardIndex === -1) {
    throw new Error('CARD_NOT_FOUND');
  }

  store.cards[cardIndex].status = status;
  await writeStore(store);

  return store.cards[cardIndex];
}

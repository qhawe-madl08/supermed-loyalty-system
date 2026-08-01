import { readStore, writeStore } from '@/lib/data-store';
import type { CardRecord } from '@/types';

export async function registerCard(cardNumber: string): Promise<CardRecord> {
  const store = await readStore();
  const card: CardRecord = {
    id: `card-${Math.random().toString(36).slice(2, 10)}`,
    card_number: cardNumber,
    status: 'AVAILABLE',
    assigned_customer_id: null,
    created_at: new Date().toISOString(),
  };

  store.cards.push(card);
  await writeStore(store);
  return card;
}

export async function bulkRegisterCards(cardNumbers: string[]): Promise<CardRecord[]> {
  const cards: CardRecord[] = [];
  for (const cardNumber of cardNumbers) {
    cards.push(await registerCard(cardNumber));
  }
  return cards;
}

export async function listCards(): Promise<CardRecord[]> {
  const store = await readStore();
  return store.cards;
}

export async function assignCard(cardId: string, customerId: string): Promise<CardRecord> {
  const store = await readStore();
  const card = store.cards.find((entry) => entry.id === cardId);

  if (!card) {
    throw new Error('Card not found');
  }

  card.status = 'ASSIGNED';
  card.assigned_customer_id = customerId;
  await writeStore(store);
  return card;
}

export async function updateCardStatus(cardId: string, status: CardRecord['status']): Promise<CardRecord> {
  const store = await readStore();
  const card = store.cards.find((entry) => entry.id === cardId);

  if (!card) {
    throw new Error('Card not found');
  }

  card.status = status;
  await writeStore(store);
  return card;
}

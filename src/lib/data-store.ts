import { promises as fs } from 'fs';
import path from 'path';
import type { Card, Customer, Settings, Transaction } from '@/types';

export interface LoyaltyStore {
  settings: Settings;
  cards: Card[];
  customers: Customer[];
  transactions: Transaction[];
}

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');

function deriveCustomerBalances(store: LoyaltyStore): LoyaltyStore {
  const balances = new Map<string, number>();

  for (const transaction of store.transactions) {
    const currentBalance = balances.get(transaction.customer_id) ?? 0;
    balances.set(transaction.customer_id, currentBalance + transaction.points);
  }

  const cardsByCustomer = new Map<string, string>();
  for (const card of store.cards) {
    if (card.customer_id) {
      cardsByCustomer.set(card.customer_id, card.id);
    }
  }

  return {
    ...store,
    customers: store.customers.map((customer) => ({
      ...customer,
      points_balance: balances.get(customer.id) ?? 0,
      card_id: cardsByCustomer.get(customer.id) ?? null,
    })),
  };
}

export function createDefaultStore(): LoyaltyStore {
  return {
    settings: {
      points_multiplier: 1,
      currency: 'USD',
    },
    cards: [],
    customers: [],
    transactions: [],
  };
}

async function ensureStoreFile(): Promise<void> {
  const directory = path.dirname(storePath);
  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(createDefaultStore(), null, 2));
  }
}

export async function readStore(): Promise<LoyaltyStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, 'utf8');
  return deriveCustomerBalances(JSON.parse(raw) as LoyaltyStore);
}

export async function writeStore(store: LoyaltyStore): Promise<void> {
  await ensureStoreFile();
  const normalizedStore = deriveCustomerBalances(store);
  await fs.writeFile(storePath, JSON.stringify(normalizedStore, null, 2));
}

export async function resetStore(): Promise<void> {
  await writeStore(createDefaultStore());
}

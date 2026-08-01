import { promises as fs } from 'fs';
import path from 'path';
import type { CardRecord, CustomerRecord, SettingsRecord, TransactionRecord } from '../types';

export interface LoyaltyStore {
  settings: SettingsRecord;
  cards: CardRecord[];
  customers: CustomerRecord[];
  transactions: TransactionRecord[];
}

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');

function createDefaultStore(): LoyaltyStore {
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
  return JSON.parse(raw) as LoyaltyStore;
}

export async function writeStore(store: LoyaltyStore): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function resetStore(): Promise<void> {
  await writeStore(createDefaultStore());
}

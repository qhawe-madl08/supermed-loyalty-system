import { promises as fs } from 'fs';
import path from 'path';
import type { LegacyCardRecord, LegacyCustomerRecord, LegacyTransactionRecord, SettingsRecord } from '../types';

export interface LoyaltyStore {
  settings: SettingsRecord;
  cards: LegacyCardRecord[];
  customers: LegacyCustomerRecord[];
  transactions: LegacyTransactionRecord[];
  audit_logs?: any[];
  idempotency_records?: any[];
}

const storePath = path.join(process.cwd(), '.data', 'loyalty-store.json');

function deriveCustomerBalances(store: LoyaltyStore): LoyaltyStore {
  const balances = new Map<string, number>();

  for (const transaction of store.transactions) {
    const currentBalance = balances.get(transaction.customer_id) ?? 0;
    balances.set(transaction.customer_id, currentBalance + transaction.points);
  }

  return {
    ...store,
    customers: store.customers.map((customer) => ({
      ...customer,
      points_balance: balances.get(customer.id) ?? 0,
    })),
  };
}

function createDefaultStore(): LoyaltyStore {
  return {
    settings: {
      points_multiplier: 1,
      currency: 'USD',
    },
    cards: [],
    customers: [],
    transactions: [],
    audit_logs: [],
    idempotency_records: [],
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
  const parsed = JSON.parse(raw) as LoyaltyStore;
  
  // Ensure new fields exist for backward compatibility
  if (!parsed.audit_logs) {
    parsed.audit_logs = [];
  }
  if (!parsed.idempotency_records) {
    parsed.idempotency_records = [];
  }
  
  return deriveCustomerBalances(parsed);
}

export async function writeStore(store: LoyaltyStore): Promise<void> {
  await ensureStoreFile();
  const normalizedStore = deriveCustomerBalances(store);
  await fs.writeFile(storePath, JSON.stringify(normalizedStore, null, 2));
}

export async function resetStore(): Promise<void> {
  await writeStore(createDefaultStore());
}

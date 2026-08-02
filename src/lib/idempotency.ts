import { readStore, writeStore } from '@/lib/data-store';
import { v4 as uuidv4 } from 'uuid';

interface IdempotencyRecord {
  id: string;
  key: string;
  response: any;
  created_at: string;
  expires_at: string;
}

interface LoyaltyStoreWithIdempotency {
  settings: any;
  cards: any[];
  customers: any[];
  transactions: any[];
  audit_logs: any[];
  idempotency_records: IdempotencyRecord[];
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function readStoreWithIdempotency(): Promise<LoyaltyStoreWithIdempotency> {
  const store = await readStore() as any;
  if (!store.idempotency_records) {
    store.idempotency_records = [];
  }
  return store;
}

async function writeStoreWithIdempotency(store: LoyaltyStoreWithIdempotency): Promise<void> {
  await writeStore(store as any);
}

export async function checkIdempotency(key: string): Promise<any | null> {
  const store = await readStoreWithIdempotency();
  const now = new Date().toISOString();
  
  // Clean up expired records
  store.idempotency_records = store.idempotency_records.filter(
    record => record.expires_at > now
  );
  
  const existingRecord = store.idempotency_records.find(record => record.key === key);
  
  if (existingRecord) {
    return existingRecord.response;
  }
  
  return null;
}

export async function recordIdempotency(key: string, response: any): Promise<void> {
  const store = await readStoreWithIdempotency();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_MS);
  
  const record: IdempotencyRecord = {
    id: `idem-${uuidv4()}`,
    key,
    response,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  
  store.idempotency_records.push(record);
  await writeStoreWithIdempotency(store);
}

export function generateIdempotencyKey(): string {
  return uuidv4();
}

import { readStore, writeStore } from '@/lib/data-store';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LoyaltyStoreWithAudit {
  settings: any;
  cards: any[];
  customers: any[];
  transactions: any[];
  audit_logs: AuditLogEntry[];
}

const AUDIT_ACTIONS = {
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CARD_ASSIGNED: 'CARD_ASSIGNED',
  PURCHASE_RECORDED: 'PURCHASE_RECORDED',
  REDEMPTION_RECORDED: 'REDEMPTION_RECORDED',
} as const;

function getTenantId(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '00000000-0000-0000-0000-000000000001';
}

function getActorId(): string | null {
  // In a real app, this would come from the authenticated user's session
  return null;
}

async function readStoreWithAudit(): Promise<LoyaltyStoreWithAudit> {
  const store = await readStore() as any;
  if (!store.audit_logs) {
    store.audit_logs = [];
  }
  return store;
}

async function writeStoreWithAudit(store: LoyaltyStoreWithAudit): Promise<void> {
  await writeStore(store as any);
}

export async function logAuditEvent(params: {
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const store = await readStoreWithAudit();
  
  const logEntry: AuditLogEntry = {
    id: `audit-${uuidv4()}`,
    tenant_id: getTenantId(),
    actor_id: getActorId(),
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    metadata: params.metadata,
    created_at: new Date().toISOString(),
  };

  store.audit_logs.push(logEntry);
  await writeStoreWithAudit(store);
}

export async function getAuditLogs(limit?: number): Promise<AuditLogEntry[]> {
  const store = await readStoreWithAudit();
  const logs = store.audit_logs.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return limit ? logs.slice(0, limit) : logs;
}

export async function getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  const store = await readStoreWithAudit();
  return store.audit_logs
    .filter(log => log.entity_type === entityType && log.entity_id === entityId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const AuditActions = AUDIT_ACTIONS;

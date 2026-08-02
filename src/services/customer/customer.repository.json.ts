import { readStore, writeStore } from '@/lib/data-store';
import type { LegacyCustomerRecord } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { logAuditEvent, AuditActions } from '@/lib/audit-logger-server';

export async function createCustomer(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  card_id?: string | null;
}): Promise<LegacyCustomerRecord> {
  const store = await readStore();

  // Check for duplicate phone
  const existingCustomer = store.customers.find(c => c.phone === input.phone);
  if (existingCustomer) {
    throw new Error('DUPLICATE_PHONE');
  }

  const customer: LegacyCustomerRecord = {
    id: `cust-${uuidv4()}`,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone,
    email: input.email ?? null,
    points_balance: 0,
    card_id: input.card_id ?? null,
    created_at: new Date().toISOString(),
  };

  store.customers.push(customer);
  await writeStore(store);

  // Log audit event
  await logAuditEvent({
    action: AuditActions.CUSTOMER_CREATED,
    entity_type: 'customer',
    entity_id: customer.id,
    metadata: {
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
    },
  });

  return customer;
}

export async function listCustomers(): Promise<LegacyCustomerRecord[]> {
  const store = await readStore();
  return store.customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function findCustomerByPhone(phone: string): Promise<LegacyCustomerRecord | undefined> {
  const store = await readStore();
  return store.customers.find(c => c.phone === phone);
}

export async function getCurrentCustomerBalance(customerId: string): Promise<number> {
  const store = await readStore();
  const customer = store.customers.find(c => c.id === customerId);
  if (!customer) {
    throw new Error('CUSTOMER_NOT_FOUND');
  }
  return customer.points_balance;
}

export async function getCustomerById(customerId: string): Promise<LegacyCustomerRecord | null> {
  const store = await readStore();
  return store.customers.find(c => c.id === customerId) ?? null;
}

export async function updateCustomerBalance(customerId: string, newBalance: number): Promise<void> {
  const store = await readStore();
  const customerIndex = store.customers.findIndex(c => c.id === customerId);
  if (customerIndex === -1) {
    throw new Error('CUSTOMER_NOT_FOUND');
  }
  const oldBalance = store.customers[customerIndex].points_balance;
  store.customers[customerIndex].points_balance = newBalance;
  await writeStore(store);
}

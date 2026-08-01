import { readStore, writeStore } from '@/lib/data-store';
import type { CustomerRecord } from '@/types';

export async function createCustomer(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  card_id?: string | null;
}): Promise<CustomerRecord> {
  const store = await readStore();
  const customer: CustomerRecord = {
    id: `cust-${Math.random().toString(36).slice(2, 10)}`,
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
  return customer;
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  const store = await readStore();
  return store.customers;
}

export async function findCustomerByPhone(phone: string): Promise<CustomerRecord | undefined> {
  const store = await readStore();
  return store.customers.find((customer) => customer.phone === phone);
}

export async function getCurrentCustomerBalance(customerId: string): Promise<number> {
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === customerId);

  if (!customer) {
    throw new Error('Customer not found');
  }

  return customer.points_balance;
}

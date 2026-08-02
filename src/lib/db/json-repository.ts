import { randomUUID } from 'crypto';
import { readStore, writeStore } from '@/lib/data-store';
import type { LoyaltyRepository } from '@/lib/db/repository';
import type {
  Card,
  CardStatus,
  Customer,
  NewCustomerInput,
  PurchaseInput,
  RedemptionInput,
  Settings,
  Transaction,
} from '@/types';

function balanceOf(transactions: Transaction[], customerId: string): number {
  return transactions
    .filter((transaction) => transaction.customer_id === customerId)
    .reduce((total, transaction) => total + transaction.points, 0);
}

function matchesQuery(customer: Customer, query: string): boolean {
  const haystack = [customer.first_name, customer.last_name, customer.phone, customer.email ?? '']
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export const jsonRepository: LoyaltyRepository = {
  async getSettings(): Promise<Settings> {
    const store = await readStore();
    return store.settings;
  },

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const store = await readStore();
    store.settings = { ...store.settings, ...patch };
    await writeStore(store);
    return store.settings;
  },

  async listCards(): Promise<Card[]> {
    const store = await readStore();
    return [...store.cards].sort((a, b) => a.card_number.localeCompare(b.card_number));
  },

  async createCards(cardNumbers: string[]): Promise<Card[]> {
    const store = await readStore();
    const existing = new Set(store.cards.map((card) => card.card_number));
    const created: Card[] = [];

    for (const cardNumber of cardNumbers) {
      if (existing.has(cardNumber)) continue;
      const card: Card = {
        id: randomUUID(),
        card_number: cardNumber,
        status: 'AVAILABLE',
        customer_id: null,
        created_at: new Date().toISOString(),
      };
      store.cards.push(card);
      existing.add(cardNumber);
      created.push(card);
    }

    await writeStore(store);
    return created;
  },

  async getCardByNumber(cardNumber: string): Promise<Card | null> {
    const store = await readStore();
    return store.cards.find((card) => card.card_number === cardNumber) ?? null;
  },

  async assignCard(cardId: string, customerId: string): Promise<Card> {
    const store = await readStore();
    const card = store.cards.find((entry) => entry.id === cardId);
    if (!card) throw new Error('Card not found');
    if (card.status === 'ASSIGNED' && card.customer_id !== customerId) {
      throw new Error('Card is already assigned to another customer');
    }
    if (card.status === 'DISABLED') throw new Error('Card is disabled');

    card.status = 'ASSIGNED';
    card.customer_id = customerId;
    await writeStore(store);
    return card;
  },

  async setCardStatus(cardId: string, status: CardStatus): Promise<Card> {
    const store = await readStore();
    const card = store.cards.find((entry) => entry.id === cardId);
    if (!card) throw new Error('Card not found');

    card.status = status;
    if (status !== 'ASSIGNED') {
      card.customer_id = null;
    }
    await writeStore(store);
    return card;
  },

  async listCustomers(): Promise<Customer[]> {
    const store = await readStore();
    return [...store.customers].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getCustomer(customerId: string): Promise<Customer | null> {
    const store = await readStore();
    return store.customers.find((customer) => customer.id === customerId) ?? null;
  },

  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    const store = await readStore();
    return store.customers.find((customer) => customer.phone === phone) ?? null;
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const store = await readStore();
    if (!query.trim()) return [];

    const cardMatch = store.cards.find(
      (card) => card.card_number.toLowerCase() === query.trim().toLowerCase()
    );
    if (cardMatch?.customer_id) {
      const customer = store.customers.find((entry) => entry.id === cardMatch.customer_id);
      if (customer) return [customer];
    }

    return store.customers.filter((customer) => matchesQuery(customer, query));
  },

  async createCustomer(input: NewCustomerInput): Promise<Customer> {
    const store = await readStore();

    if (store.customers.some((customer) => customer.phone === input.phone)) {
      throw new Error('A customer with this phone number already exists');
    }

    const customer: Customer = {
      id: randomUUID(),
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      email: input.email ?? null,
      points_balance: 0,
      card_id: null,
      created_at: new Date().toISOString(),
    };

    store.customers.push(customer);
    await writeStore(store);

    if (input.card_id) {
      await this.assignCard(input.card_id, customer.id);
      customer.card_id = input.card_id;
    }

    return customer;
  },

  async listTransactions(limit?: number): Promise<Transaction[]> {
    const store = await readStore();
    const transactions = [...store.transactions].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    return typeof limit === 'number' ? transactions.slice(0, limit) : transactions;
  },

  async listCustomerTransactions(customerId: string): Promise<Transaction[]> {
    const store = await readStore();
    return store.transactions
      .filter((transaction) => transaction.customer_id === customerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async recordPurchase(input: PurchaseInput & { points: number }): Promise<Transaction> {
    const store = await readStore();
    const balanceAfter = balanceOf(store.transactions, input.customer_id) + input.points;

    const transaction: Transaction = {
      id: randomUUID(),
      customer_id: input.customer_id,
      branch_id: input.branch_id ?? null,
      staff_id: input.staff_id ?? null,
      transaction_type: 'PURCHASE',
      purchase_amount: input.amount,
      points: input.points,
      balance_after: balanceAfter,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };

    store.transactions.push(transaction);
    await writeStore(store);
    return transaction;
  },

  async recordRedemption(input: RedemptionInput): Promise<Transaction> {
    const store = await readStore();
    const points = Math.abs(input.points);
    const balanceBefore = balanceOf(store.transactions, input.customer_id);

    if (points > balanceBefore) {
      throw new Error('Insufficient points balance');
    }

    const transaction: Transaction = {
      id: randomUUID(),
      customer_id: input.customer_id,
      branch_id: input.branch_id ?? null,
      staff_id: input.staff_id ?? null,
      transaction_type: 'REDEMPTION',
      purchase_amount: null,
      points: -points,
      balance_after: balanceBefore - points,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };

    store.transactions.push(transaction);
    await writeStore(store);
    return transaction;
  },
};

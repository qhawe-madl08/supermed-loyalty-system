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

/**
 * Every read and write in the application goes through this interface so the
 * app never mixes storage backends. Two implementations exist: a JSON file
 * store for local development and a Supabase store for production.
 */
export interface LoyaltyRepository {
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  listCards(): Promise<Card[]>;
  createCards(cardNumbers: string[]): Promise<Card[]>;
  getCardByNumber(cardNumber: string): Promise<Card | null>;
  assignCard(cardId: string, customerId: string): Promise<Card>;
  setCardStatus(cardId: string, status: CardStatus): Promise<Card>;

  listCustomers(): Promise<Customer[]>;
  getCustomer(customerId: string): Promise<Customer | null>;
  findCustomerByPhone(phone: string): Promise<Customer | null>;
  searchCustomers(query: string): Promise<Customer[]>;
  createCustomer(input: NewCustomerInput): Promise<Customer>;

  listTransactions(limit?: number): Promise<Transaction[]>;
  listCustomerTransactions(customerId: string): Promise<Transaction[]>;
  recordPurchase(input: PurchaseInput & { points: number }): Promise<Transaction>;
  recordRedemption(input: RedemptionInput): Promise<Transaction>;
}

export type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'DISABLED';

export type TransactionType = 'PURCHASE' | 'REDEMPTION' | 'ADJUSTMENT';

export interface Settings {
  points_multiplier: number;
  currency: string;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  points_balance: number;
  card_id: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  card_number: string;
  status: CardStatus;
  customer_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  branch_id: string | null;
  staff_id: string | null;
  transaction_type: TransactionType;
  purchase_amount: number | null;
  points: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
}

export interface NewCustomerInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  card_id?: string | null;
}

export interface PurchaseInput {
  customer_id: string;
  amount: number;
  staff_id?: string | null;
  branch_id?: string | null;
  notes?: string | null;
}

export interface RedemptionInput {
  customer_id: string;
  points: number;
  staff_id?: string | null;
  branch_id?: string | null;
  notes?: string | null;
}

export interface SettingsRecord {
  points_multiplier: number;
  currency: string;
}

export interface CardRecord {
  id: string;
  card_number: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'LOST' | 'REPLACED' | 'DISABLED';
  assigned_customer_id?: string | null;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  customer_id: string;
  cashier_id?: string | null;
  transaction_type: 'PURCHASE' | 'REDEMPTION' | 'MANUAL_ADJUSTMENT';
  purchase_amount?: number | null;
  points: number;
  balance_before: number;
  balance_after: number;
  notes?: string | null;
  created_at: string;
}

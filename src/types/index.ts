export interface SettingsRecord {
  points_multiplier: number;
  currency: string;
}

// Supabase-aligned types
export interface CustomerRecord {
  id: string;
  tenant_id: string;
  full_name: string;
  phone_e164: string;
  email: string | null;
  date_of_birth: string | null;
  tier_id: string | null;
  points_balance: number;
  preferred_channel: string;
  consent_given_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy type for backward compatibility with existing UI
export interface LegacyCustomerRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  points_balance: number;
  card_id?: string | null;
  created_at: string;
}

export interface CardRecord {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  card_code: string;
  card_type: 'qr' | 'barcode' | 'virtual';
  status: 'available' | 'active' | 'lost' | 'frozen' | 'replaced' | 'revoked';
  issued_at: string;
  replaced_from_card_id: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy type for backward compatibility
export interface LegacyCardRecord {
  id: string;
  card_number: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'LOST' | 'REPLACED' | 'DISABLED';
  assigned_customer_id?: string | null;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  branch_id: string | null;
  staff_id: string | null;
  txn_type: 'earn' | 'redeem' | 'adjustment' | 'expiry' | 'refund_reversal';
  points: number;
  currency: string | null;
  amount: number | null;
  reference_pos_txn_id: string | null;
  reason: string | null;
  idempotency_key: string;
  created_at: string;
}

// Legacy type for backward compatibility
export interface LegacyTransactionRecord {
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

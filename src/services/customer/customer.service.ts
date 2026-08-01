export interface CustomerRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  points_balance: number;
  card_id?: string | null;
  created_at: string;
}

export function createCustomerProfile(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  card_id?: string | null;
}): CustomerRecord {
  return {
    id: `cust-${Math.random().toString(36).slice(2, 10)}`,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone,
    email: input.email ?? null,
    points_balance: 0,
    card_id: input.card_id ?? null,
    created_at: new Date().toISOString(),
  };
}

import { calculateDashboardSummary } from '@/lib/dashboard';
import type { Card, Customer, Transaction } from '@/types';

const customers: Customer[] = [
  {
    id: 'cus-1',
    first_name: 'Ava',
    last_name: 'Ngwenya',
    phone: '+263771111111',
    email: null,
    points_balance: 150,
    card_id: 'card-1',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cus-2',
    first_name: 'Bongani',
    last_name: 'Dube',
    phone: '+263772222222',
    email: null,
    points_balance: 120,
    card_id: null,
    created_at: '2024-01-02T00:00:00.000Z',
  },
];

const cards: Card[] = [
  { id: 'card-1', card_number: 'SM000001', status: 'ASSIGNED', customer_id: 'cus-1', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 'card-2', card_number: 'SM000002', status: 'AVAILABLE', customer_id: null, created_at: '2024-01-01T00:00:00.000Z' },
];

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    customer_id: 'cus-1',
    branch_id: null,
    staff_id: null,
    transaction_type: 'PURCHASE',
    purchase_amount: 25,
    points: 250,
    balance_after: 250,
    notes: null,
    created_at: '2024-01-01T10:00:00.000Z',
  },
  {
    id: 'tx-2',
    customer_id: 'cus-1',
    branch_id: null,
    staff_id: null,
    transaction_type: 'REDEMPTION',
    purchase_amount: null,
    points: -100,
    balance_after: 150,
    notes: null,
    created_at: '2024-01-01T11:00:00.000Z',
  },
  {
    id: 'tx-3',
    customer_id: 'cus-2',
    branch_id: null,
    staff_id: null,
    transaction_type: 'PURCHASE',
    purchase_amount: 12,
    points: 120,
    balance_after: 120,
    notes: null,
    created_at: '2024-01-02T08:00:00.000Z',
  },
];

describe('calculateDashboardSummary', () => {
  it('groups the daily metrics', () => {
    const summary = calculateDashboardSummary({ customers, transactions, cards }, '2024-01-01');

    expect(summary).toEqual({
      newCustomers: 1,
      purchaseCount: 1,
      pointsIssued: 250,
      pointsRedeemed: 100,
      availableCards: 1,
      assignedCards: 1,
      totalCustomers: 2,
    });
  });
});

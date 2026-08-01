import { calculateDashboardSummary } from '../../src/lib/dashboard';

describe('calculateDashboardSummary', () => {
  it('groups the daily metrics from the loyalty store', () => {
    const store = {
      settings: { points_multiplier: 1, currency: 'USD' },
      cards: [
        { id: 'card-1', card_number: '1001', status: 'ASSIGNED' as const, assigned_customer_id: 'cus-1', created_at: '2024-01-01T00:00:00.000Z' },
        { id: 'card-2', card_number: '1002', status: 'AVAILABLE' as const, created_at: '2024-01-01T00:00:00.000Z' },
      ],
      customers: [
        { id: 'cus-1', first_name: 'Ava', last_name: 'Ngwenya', phone: '+263771111111', email: 'ava@example.com', points_balance: 0, card_id: 'card-1', created_at: '2024-01-01T00:00:00.000Z' },
        { id: 'cus-2', first_name: 'Bongani', last_name: 'Dube', phone: '+263772222222', email: null, points_balance: 0, card_id: null, created_at: '2024-01-02T00:00:00.000Z' },
      ],
      transactions: [
        { id: 'tx-1', customer_id: 'cus-1', transaction_type: 'PURCHASE' as const, purchase_amount: 25, points: 250, balance_before: 0, balance_after: 250, created_at: '2024-01-01T10:00:00.000Z' },
        { id: 'tx-2', customer_id: 'cus-1', transaction_type: 'REDEMPTION' as const, purchase_amount: null, points: -100, balance_before: 250, balance_after: 150, created_at: '2024-01-01T11:00:00.000Z' },
        { id: 'tx-3', customer_id: 'cus-2', transaction_type: 'PURCHASE' as const, purchase_amount: 12, points: 120, balance_before: 0, balance_after: 120, created_at: '2024-01-02T08:00:00.000Z' },
      ],
    };

    const summary = calculateDashboardSummary(store, '2024-01-01');

    expect(summary.newCustomers).toBe(1);
    expect(summary.purchaseCount).toBe(1);
    expect(summary.pointsIssued).toBe(250);
    expect(summary.pointsRedeemed).toBe(100);
    expect(summary.availableCards).toBe(1);
    expect(summary.assignedCards).toBe(1);
    expect(summary.totalCustomers).toBe(2);
  });
});

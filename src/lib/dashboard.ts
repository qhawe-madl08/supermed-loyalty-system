import type { LoyaltyStore } from './data-store';

export interface DashboardSummary {
  newCustomers: number;
  purchaseCount: number;
  pointsIssued: number;
  pointsRedeemed: number;
  availableCards: number;
  assignedCards: number;
  totalCustomers: number;
}

export function calculateDashboardSummary(store: LoyaltyStore, day: string): DashboardSummary {
  const dayTransactions = store.transactions.filter((transaction) => transaction.created_at.startsWith(day));

  return {
    newCustomers: store.customers.filter((customer) => customer.created_at.startsWith(day)).length,
    purchaseCount: dayTransactions.filter((transaction) => transaction.transaction_type === 'PURCHASE').length,
    pointsIssued: dayTransactions.filter((transaction) => transaction.points > 0).reduce((sum, transaction) => sum + transaction.points, 0),
    pointsRedeemed: Math.abs(dayTransactions.filter((transaction) => transaction.points < 0).reduce((sum, transaction) => sum + transaction.points, 0)),
    availableCards: store.cards.filter((card) => card.status === 'AVAILABLE').length,
    assignedCards: store.cards.filter((card) => card.status === 'ASSIGNED').length,
    totalCustomers: store.customers.length,
  };
}

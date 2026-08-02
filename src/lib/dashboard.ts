import type { Card, Customer, Transaction } from '@/types';

export interface DashboardSummary {
  newCustomers: number;
  purchaseCount: number;
  pointsIssued: number;
  pointsRedeemed: number;
  availableCards: number;
  assignedCards: number;
  totalCustomers: number;
}

export interface DashboardInput {
  customers: Customer[];
  transactions: Transaction[];
  cards: Card[];
}

export function calculateDashboardSummary(input: DashboardInput, day: string): DashboardSummary {
  const dayTransactions = input.transactions.filter((transaction) => transaction.created_at.startsWith(day));

  return {
    newCustomers: input.customers.filter((customer) => customer.created_at.startsWith(day)).length,
    purchaseCount: dayTransactions.filter((transaction) => transaction.transaction_type === 'PURCHASE').length,
    pointsIssued: dayTransactions
      .filter((transaction) => transaction.points > 0)
      .reduce((sum, transaction) => sum + transaction.points, 0),
    pointsRedeemed: Math.abs(
      dayTransactions
        .filter((transaction) => transaction.points < 0)
        .reduce((sum, transaction) => sum + transaction.points, 0)
    ),
    availableCards: input.cards.filter((card) => card.status === 'AVAILABLE').length,
    assignedCards: input.cards.filter((card) => card.status === 'ASSIGNED').length,
    totalCustomers: input.customers.length,
  };
}

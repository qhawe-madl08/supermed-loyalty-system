import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const pointsBalance = store.transactions
    .filter((transaction) => transaction.customer_id === params.id)
    .reduce((runningBalance, transaction) => runningBalance + transaction.points, 0);

  return NextResponse.json({
    customer_id: customer.id,
    points_balance: pointsBalance,
    tier_name: 'Standard',
    next_reward: 'Redeem 100 points',
  });
}

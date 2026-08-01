import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({
    customer_id: customer.id,
    points_balance: customer.points_balance,
    tier_name: 'Standard',
    next_reward: 'Redeem 100 points',
  });
}

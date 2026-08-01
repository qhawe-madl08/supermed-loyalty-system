import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const transactions = store.transactions.filter((entry) => entry.customer_id === params.id);
  return NextResponse.json({ customer, transactions });
}

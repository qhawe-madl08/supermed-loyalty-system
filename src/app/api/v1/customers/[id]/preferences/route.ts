import { NextResponse } from 'next/server';
import { readStore, writeStore } from '@/lib/data-store';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  customer.email = body.email ?? customer.email;
  await writeStore(store);
  return NextResponse.json({ customer });
}

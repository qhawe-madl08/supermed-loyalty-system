import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const store = await readStore();
  const events = store.transactions.filter((entry) => entry.customer_id === params.id);
  return NextResponse.json({ events, count: events.length });
}

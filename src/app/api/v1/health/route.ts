import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'local',
    cards: store.cards.length,
    customers: store.customers.length,
    transactions: store.transactions.length,
  });
}

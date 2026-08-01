import { NextResponse } from 'next/server';
import { readStore } from '@/lib/data-store';

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ entries: store.transactions, count: store.transactions.length });
}

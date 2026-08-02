import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const transactions = await getRepository().listTransactions(100);
  return NextResponse.json({ entries: transactions, count: transactions.length });
}

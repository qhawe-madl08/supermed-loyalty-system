import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const transactions = await getRepository().listCustomerTransactions(params.id);
  return NextResponse.json({ events: transactions, count: transactions.length });
}

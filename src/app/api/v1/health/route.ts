import { NextResponse } from 'next/server';
import { activeBackend, getRepository } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const repository = getRepository();

  try {
    const [customers, cards, transactions] = await Promise.all([
      repository.listCustomers(),
      repository.listCards(),
      repository.listTransactions(),
    ]);

    return NextResponse.json({
      status: 'ok',
      backend: activeBackend(),
      timestamp: new Date().toISOString(),
      customers: customers.length,
      cards: cards.length,
      transactions: transactions.length,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', backend: activeBackend(), error: (error as Error).message },
      { status: 503 }
    );
  }
}

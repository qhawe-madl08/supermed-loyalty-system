import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { recordPurchase, redeemPoints } from '@/services/loyalty/loyalty.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '') || undefined;
  const transactions = await getRepository().listTransactions(limit);
  return NextResponse.json({ transactions, count: transactions.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const repository = getRepository();
  const customer = await repository.getCustomer(body.customer_id ?? '');

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  try {
    const transaction =
      body.transaction_type === 'REDEMPTION'
        ? await redeemPoints({
            customer_id: customer.id,
            points: Number(body.points),
            staff_id: body.staff_id ?? null,
            branch_id: body.branch_id ?? null,
            notes: body.notes ?? null,
          })
        : await recordPurchase({
            customer_id: customer.id,
            amount: Number(body.amount ?? body.amount_usd),
            staff_id: body.staff_id ?? null,
            branch_id: body.branch_id ?? null,
            notes: body.notes ?? null,
          });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

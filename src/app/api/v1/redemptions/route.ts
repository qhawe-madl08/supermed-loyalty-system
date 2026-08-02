import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { redeemPoints } from '@/services/loyalty/loyalty.service';

export async function POST(request: Request) {
  const body = await request.json();
  const repository = getRepository();
  const customer = body.customer_id
    ? await repository.getCustomer(body.customer_id)
    : await repository.findCustomerByPhone(body.phone ?? '');

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  try {
    const transaction = await redeemPoints({
      customer_id: customer.id,
      points: Number(body.points),
      staff_id: body.staff_id ?? null,
      branch_id: body.branch_id ?? null,
      notes: body.notes ?? null,
    });

    return NextResponse.json(
      {
        redemption_id: transaction.id,
        points_spent: Math.abs(transaction.points),
        new_balance: transaction.balance_after,
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

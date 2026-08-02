import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const customer = await getRepository().getCustomer(params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({
    customer_id: customer.id,
    points_balance: customer.points_balance,
  });
}

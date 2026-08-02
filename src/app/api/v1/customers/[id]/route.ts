import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const repository = getRepository();
  const customer = await repository.getCustomer(params.id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const transactions = await repository.listCustomerTransactions(customer.id);
  return NextResponse.json({ customer, transactions });
}

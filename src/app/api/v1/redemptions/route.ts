import { NextResponse } from 'next/server';
import { createRedemptionTransaction } from '@/services/transactions/transaction.repository';
import { updateCustomerBalance, findCustomerByPhone } from '@/services/customer/customer.repository';
import { readStore } from '@/lib/data-store';

export async function POST(request: Request) {
  const body = await request.json();
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === body.customer_id) ?? (await findCustomerByPhone(body.phone ?? ''));

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const balanceBefore = customer.points_balance;
  const transaction = await createRedemptionTransaction({
    customerId: customer.id,
    cashierId: body.cashier_id,
    points: body.points,
    balanceBefore,
    notes: body.notes,
  });

  const balanceAfter = transaction.balance_after;
  await updateCustomerBalance(customer.id, balanceAfter);

  return NextResponse.json({ redemption_id: transaction.id, points_spent: body.points, new_balance: balanceAfter, transaction });
}

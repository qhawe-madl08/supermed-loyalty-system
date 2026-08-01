import { NextResponse } from 'next/server';
import { createPurchaseTransaction, createRedemptionTransaction, listTransactions } from '@/services/transactions/transaction.repository';
import { updateCustomerBalance } from '@/services/customer/customer.repository';
import { readStore } from '@/lib/data-store';

export async function GET() {
  const transactions = await listTransactions();
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const store = await readStore();
  const customer = store.customers.find((entry) => entry.id === body.customer_id);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  if (body.transaction_type === 'REDEMPTION') {
    const transaction = await createRedemptionTransaction({
      customerId: customer.id,
      cashierId: body.cashier_id,
      points: body.points,
      balanceBefore: customer.points_balance,
      notes: body.notes,
    });

    await updateCustomerBalance(customer.id, transaction.balance_after);
    return NextResponse.json(transaction);
  }

  const transaction = await createPurchaseTransaction({
    customerId: customer.id,
    cashierId: body.cashier_id,
    amountUsd: body.amount_usd,
    multiplier: body.multiplier ?? store.settings.points_multiplier,
    balanceBefore: customer.points_balance,
    notes: body.notes,
  });

  await updateCustomerBalance(customer.id, transaction.balance_after);
  return NextResponse.json(transaction);
}

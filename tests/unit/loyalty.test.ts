import { resetStore, readStore } from '@/lib/data-store';
import { createCustomer } from '@/services/customer/customer.repository';
import { createPurchaseTransaction, createRedemptionTransaction } from '@/services/transactions/transaction.repository';

describe('ledger-based loyalty balances', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('derives customer balance from the transaction ledger', async () => {
    const customer = await createCustomer({
      first_name: 'Ada',
      last_name: 'Lovelace',
      phone: '555-0100',
      email: 'ada@example.com',
    });

    const purchase = await createPurchaseTransaction({
      customerId: customer.id,
      amountUsd: 20,
      multiplier: 1,
      notes: 'first purchase',
    });

    const afterPurchase = await readStore();
    const customerAfterPurchase = afterPurchase.customers.find((entry) => entry.id === customer.id);

    expect(purchase.balance_after).toBe(20);
    expect(customerAfterPurchase?.points_balance).toBe(20);

    const redemption = await createRedemptionTransaction({
      customerId: customer.id,
      points: 5,
      notes: 'redeem points',
    });

    const afterRedemption = await readStore();
    const customerAfterRedemption = afterRedemption.customers.find((entry) => entry.id === customer.id);

    expect(redemption.balance_after).toBe(15);
    expect(customerAfterRedemption?.points_balance).toBe(15);
    expect(afterRedemption.transactions).toHaveLength(2);
  });
});

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRepository } from '@/lib/db';
import { formatCustomerName } from '@/lib/workflow';
import { assignCard } from '@/app/actions/customer-actions';
import { recordTransaction } from '@/app/actions/transaction-actions';

export const dynamic = 'force-dynamic';

interface CustomerDetailPageProps {
  params: { id: string };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const repository = getRepository();
  const customer = await repository.getCustomer(params.id);

  if (!customer) {
    notFound();
  }

  const [transactions, cards, settings] = await Promise.all([
    repository.listCustomerTransactions(customer.id),
    repository.listCards(),
    repository.getSettings(),
  ]);

  const availableCards = cards.filter((card) => card.status === 'AVAILABLE');
  const assignedCard = cards.find((card) => card.id === customer.card_id);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Customer</p>
            <h1 className="text-3xl font-semibold">{formatCustomerName(customer)}</h1>
            <p className="text-sm text-slate-500">{customer.phone}</p>
          </div>
          <Link href="/workflows/customers" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to customers
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Points balance</p>
            <p className="mt-1 text-4xl font-semibold text-blue-600">{customer.points_balance}</p>

            <dl className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd>{customer.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Loyalty card</dt>
                <dd>{assignedCard ? assignedCard.card_number : 'Not assigned'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Registered</dt>
                <dd>{new Date(customer.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>

            {!assignedCard && (
              <form action={assignCard} className="mt-6 border-t border-slate-100 pt-4">
                <input type="hidden" name="customer_id" value={customer.id} />
                <label className="text-sm font-medium text-slate-700">
                  Assign a loyalty card
                  <select name="card_id" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                    <option value="">Select a card</option>
                    {availableCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.card_number}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Assign card
                </button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Record a purchase</h2>
            <form action={recordTransaction} className="mt-4 space-y-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="transaction_type" value="PURCHASE" />
              <label className="block text-sm font-medium text-slate-700">
                Purchase amount ({settings.currency})
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="42.75"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <p className="text-xs text-slate-500">
                Earns {settings.points_multiplier} point{settings.points_multiplier === 1 ? '' : 's'} per {settings.currency} 1, rounded down.
              </p>
              <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Record purchase
              </button>
            </form>

            <h2 className="mt-8 text-lg font-semibold">Redeem points</h2>
            <form action={recordTransaction} className="mt-4 space-y-3">
              <input type="hidden" name="customer_id" value={customer.id} />
              <input type="hidden" name="transaction_type" value="REDEMPTION" />
              <label className="block text-sm font-medium text-slate-700">
                Points to redeem
                <input
                  type="number"
                  name="points"
                  step="1"
                  min="1"
                  max={customer.points_balance}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={customer.points_balance <= 0}
                className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Redeem points
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Transaction history</h2>
          {transactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No transactions recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Points</th>
                    <th className="pb-2 font-medium">Balance after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="py-3 text-slate-600">{new Date(transaction.created_at).toLocaleString()}</td>
                      <td className="py-3">{transaction.transaction_type === 'PURCHASE' ? 'Purchase' : 'Redemption'}</td>
                      <td className="py-3">{transaction.purchase_amount === null ? '—' : `$${transaction.purchase_amount.toFixed(2)}`}</td>
                      <td className={`py-3 font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                      </td>
                      <td className="py-3">{transaction.balance_after} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

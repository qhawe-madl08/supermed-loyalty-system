import Link from 'next/link';
import { getCustomerById } from '@/services/customer/customer.repository';
import { getCustomerTransactions } from '@/services/transactions/transaction.repository';
import type { LegacyCustomerRecord, LegacyTransactionRecord } from '@/types';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Customers</p>
              <h1 className="text-3xl font-semibold">Customer not found</h1>
            </div>
            <Link href="/workflows/customers" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
              Back to customers
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <p className="text-slate-500">No customer found with ID: {id}</p>
          </div>
        </div>
      </main>
    );
  }

  const customerTransactions = await getCustomerTransactions(customer.id);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Customers</p>
            <h1 className="text-3xl font-semibold">{customer.first_name} {customer.last_name}</h1>
          </div>
          <Link href="/workflows/customers" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to customers
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Profile</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">{customer.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Current balance</dt>
                <dd className="font-semibold text-2xl text-blue-600">{customer.points_balance} pts</dd>
              </div>
              <div>
                <dt className="text-slate-500">Card status</dt>
                <dd className="font-medium">
                  {customer.card_id ? (
                    <>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Linked
                      </span>
                      <p className="mt-1 text-xs text-slate-500">Card linked</p>
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      No card assigned
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Enrolled</dt>
                <dd className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Record a purchase to add points</li>
              <li>Redeem points for rewards</li>
              <li>View full transaction history below</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workflows/transaction" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Record transaction
              </Link>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold">Transaction history</h2>
            <Link href="/workflows/transaction" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Record new transaction
            </Link>
          </div>

          {customerTransactions.length === 0 ? (
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
                    <th className="pb-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerTransactions.map((transaction: LegacyTransactionRecord) => (
                    <tr key={transaction.id} className="hover:bg-slate-50">
                      <td className="py-3 text-slate-600">
                        {new Date(transaction.created_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        {transaction.transaction_type === 'PURCHASE' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Purchase
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            Redemption
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-medium">
                        {transaction.purchase_amount ? `$${transaction.purchase_amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 font-medium">
                        {transaction.points > 0 ? (
                          <span className="text-green-600">+{transaction.points}</span>
                        ) : (
                          <span className="text-red-600">{transaction.points}</span>
                        )}
                      </td>
                      <td className="py-3 font-medium">{transaction.balance_after} pts</td>
                      <td className="py-3 text-slate-600">{transaction.notes ?? '—'}</td>
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
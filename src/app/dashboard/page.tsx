import Link from 'next/link';
import { listCustomers } from '@/services/customer/customer.repository';
import { listTransactions } from '@/services/transactions/transaction.repository';
import type { LegacyCustomerRecord, LegacyTransactionRecord } from '@/types';

export default async function DashboardPage() {
  const customers = await listCustomers();
  const allTransactions = await listTransactions();
  const today = new Date().toISOString().slice(0, 10);

  // Calculate summary manually since we don't have the local store
  const todayTransactions = allTransactions.filter((t) => t.created_at.startsWith(today));
  const todayCustomers = customers.filter((c) => c.created_at.startsWith(today));

  const summary = {
    newCustomers: todayCustomers.length,
    purchaseCount: todayTransactions.filter((t) => t.transaction_type === 'PURCHASE').length,
    pointsIssued: todayTransactions.filter((t) => t.points > 0).reduce((sum, t) => sum + t.points, 0),
    pointsRedeemed: Math.abs(todayTransactions.filter((t) => t.points < 0).reduce((sum, t) => sum + t.points, 0)),
    availableCards: 0, // Would need to query cards table
    assignedCards: 0,  // Would need to query cards table
    totalCustomers: customers.length,
  };

  const recentTransactions = allTransactions.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Dashboard</p>
            <h1 className="text-3xl font-semibold">Supermed loyalty operations</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/workflows" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
              Open workflows
            </Link>
            <Link href="/workflows/customers" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
              Customer list
            </Link>
            <Link href="/workflows/transaction" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Record transaction
            </Link>
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
              Back home
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Today's registrations", value: summary.newCustomers },
            { label: "Today's purchases", value: summary.purchaseCount },
            { label: 'Points issued today', value: summary.pointsIssued },
            { label: 'Points redeemed today', value: summary.pointsRedeemed },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Recent transactions</h2>
            <Link href="/workflows/transaction" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Record new
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Points</th>
                    <th className="pb-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((transaction: LegacyTransactionRecord) => {
                    const customer = customers.find((c: LegacyCustomerRecord) => c.id === transaction.customer_id);
                    return (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="py-3 text-slate-600">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 font-medium">
                          {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Next actions for the till</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. Review the current customer list before assigning or reissuing cards.</li>
              <li>2. Record earn or redeem events through the transaction flow for a complete ledger.</li>
              <li>3. Use the API endpoints as the operational backend while the product UI continues to evolve.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Inventory snapshot</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Available cards</span><span>{summary.availableCards}</span></div>
              <div className="flex justify-between"><span>Assigned cards</span><span>{summary.assignedCards}</span></div>
              <div className="flex justify-between"><span>Total customers</span><span>{summary.totalCustomers}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

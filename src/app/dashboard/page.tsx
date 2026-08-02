import Link from 'next/link';
import { getRepository } from '@/lib/db';
import { calculateDashboardSummary } from '@/lib/dashboard';
import { formatCustomerName } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const repository = getRepository();
  const [customers, transactions, cards] = await Promise.all([
    repository.listCustomers(),
    repository.listTransactions(),
    repository.listCards(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const summary = calculateDashboardSummary({ customers, transactions, cards }, today);
  const recentTransactions = transactions.slice(0, 5);
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Dashboard</p>
            <h1 className="text-3xl font-semibold">Supermed loyalty operations</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/workflows/customers" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
              Customers
            </Link>
            <Link href="/workflows/enroll" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Register customer
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
          <h2 className="text-lg font-semibold">Recent activity</h2>

          {recentTransactions.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No transactions recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((transaction) => {
                    const customer = customersById.get(transaction.customer_id);
                    return (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="py-3 text-slate-600">{new Date(transaction.created_at).toLocaleString()}</td>
                        <td className="py-3 font-medium">{customer ? formatCustomerName(customer) : 'Unknown'}</td>
                        <td className="py-3">{transaction.transaction_type === 'PURCHASE' ? 'Purchase' : 'Redemption'}</td>
                        <td className="py-3">{transaction.purchase_amount === null ? '—' : `$${transaction.purchase_amount.toFixed(2)}`}</td>
                        <td className={`py-3 font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Card inventory</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex justify-between"><span>Available cards</span><span className="font-medium">{summary.availableCards}</span></div>
            <div className="flex justify-between"><span>Assigned cards</span><span className="font-medium">{summary.assignedCards}</span></div>
            <div className="flex justify-between"><span>Total customers</span><span className="font-medium">{summary.totalCustomers}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}

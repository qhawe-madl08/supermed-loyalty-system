import Link from 'next/link';
import { readStore } from '@/lib/data-store';
import { formatCustomerName } from '@/lib/workflow';

export default async function WorkflowsPage() {
  const store = await readStore();
  const recentCustomers = [...store.customers].slice(-6).reverse();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Workflow</p>
            <h1 className="text-3xl font-semibold">Customer operations</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Current customer queue</h2>
            <div className="mt-4 space-y-3">
              {recentCustomers.length === 0 ? (
                <p className="text-sm text-slate-500">No customers have been enrolled yet.</p>
              ) : (
                recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <div>
                      <p className="font-medium">{formatCustomerName(customer)}</p>
                      <p className="text-sm text-slate-500">{customer.phone}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{customer.points_balance} pts</p>
                      <p>{customer.card_id ? 'Card linked' : 'No card'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Suggested next actions</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Use the enrollment endpoint to add a new customer with an available card.</li>
              <li>Record a purchase to generate points and update the ledger.</li>
              <li>Redeem points when the customer is ready to claim a reward.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workflows/enroll" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Enroll customer
              </Link>
              <Link href="/workflows/transaction" className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Record transaction
              </Link>
              <Link href="/api/v1/transactions" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600">
                Open transactions API
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

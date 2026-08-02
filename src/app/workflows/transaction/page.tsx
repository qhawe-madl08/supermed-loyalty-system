import Link from 'next/link';
import { listCustomers } from '@/services/customer/customer.repository';
import { recordTransaction } from '@/app/actions/transaction-actions';
import type { LegacyCustomerRecord } from '@/types';

export default async function TransactionPage() {
  const customers = (await listCustomers()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Transaction</p>
            <h1 className="text-3xl font-semibold">Record purchase or redemption</h1>
          </div>
          <Link href="/workflows" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to workflows
          </Link>
        </div>

        <form action={recordTransaction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Customer
              <select name="customer_id" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="">Select a customer</option>
                {customers.map((customer: LegacyCustomerRecord) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} ({customer.phone}) — {customer.points_balance} pts
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Type
              <select name="transaction_type" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="PURCHASE">Purchase</option>
                <option value="REDEMPTION">Redemption</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Amount (USD)
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                placeholder="e.g. 25.50"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-500">Required for purchases</p>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Points
              <input
                type="number"
                name="points"
                step="1"
                min="1"
                placeholder="e.g. 500"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <p className="mt-1 text-xs text-slate-500">Required for redemptions</p>
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Notes
            <textarea name="notes" rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
          </label>

          <button type="submit" className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Record transaction
          </button>
        </form>
      </div>
    </main>
  );
}
import Link from 'next/link';
import { listCustomers } from '@/services/customer/customer.repository';
import type { LegacyCustomerRecord } from '@/types';

export default async function CustomersPage() {
  const customers = (await listCustomers()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Customers</p>
            <h1 className="text-3xl font-semibold">Search & lookup</h1>
          </div>
          <Link href="/workflows" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to workflows
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold">All customers</h2>
            <Link href="/workflows/enroll" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Enroll new customer
            </Link>
          </div>

          {customers.length === 0 ? (
            <p className="text-sm text-slate-500">No customers enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Balance</th>
                    <th className="pb-2 font-medium">Card</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer: LegacyCustomerRecord) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium">{customer.first_name} {customer.last_name}</td>
                      <td className="py-3 text-slate-600">{customer.phone}</td>
                      <td className="py-3 text-slate-600">{customer.email ?? '—'}</td>
                      <td className="py-3 font-semibold text-blue-600">{customer.points_balance} pts</td>
                      <td className="py-3">
                        {customer.card_id ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                            No card
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/workflows/customers/${customer.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
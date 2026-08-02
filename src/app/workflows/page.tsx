import Link from 'next/link';
import { getRepository } from '@/lib/db';
import { formatCustomerName } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
  const recentCustomers = (await getRepository().listCustomers()).slice(0, 6);

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
            <h2 className="text-lg font-semibold">Recently registered</h2>
            <div className="mt-4 space-y-3">
              {recentCustomers.length === 0 ? (
                <p className="text-sm text-slate-500">No customers have been registered yet.</p>
              ) : (
                recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/workflows/customers/${customer.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 transition hover:border-blue-500"
                  >
                    <div>
                      <p className="font-medium">{formatCustomerName(customer)}</p>
                      <p className="text-sm text-slate-500">{customer.phone}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{customer.points_balance} pts</p>
                      <p>{customer.card_id ? 'Card linked' : 'No card'}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Quick actions</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workflows/enroll" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Register customer
              </Link>
              <Link href="/workflows/customers" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600">
                Find customer
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

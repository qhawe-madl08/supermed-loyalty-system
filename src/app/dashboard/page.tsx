import Link from 'next/link';
import { readStore } from '@/lib/data-store';
import { calculateDashboardSummary } from '@/lib/dashboard';

export default async function DashboardPage() {
  const store = await readStore();
  const today = new Date().toISOString().slice(0, 10);
  const summary = calculateDashboardSummary(store, today);

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

import Link from 'next/link';
import { readStore } from '@/lib/data-store';

export default async function DashboardPage() {
  const store = await readStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayTransactions = store.transactions.filter((transaction) => transaction.created_at.startsWith(today));
  const pointsIssuedToday = todayTransactions.filter((transaction) => transaction.points > 0).reduce((sum, transaction) => sum + transaction.points, 0);
  const pointsRedeemedToday = Math.abs(todayTransactions.filter((transaction) => transaction.points < 0).reduce((sum, transaction) => sum + transaction.points, 0));

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Dashboard</p>
            <h1 className="text-3xl font-semibold">Supermed loyalty operations</h1>
          </div>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600">
            Back home
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Today\'s registrations', value: store.customers.filter((customer) => customer.created_at.startsWith(today)).length },
            { label: 'Today\'s purchases', value: todayTransactions.filter((transaction) => transaction.transaction_type === 'PURCHASE').length },
            { label: 'Points issued today', value: pointsIssuedToday },
            { label: 'Points redeemed today', value: pointsRedeemedToday },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Customer workflow</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>1. Register cards from the cards endpoint.</li>
              <li>2. Enroll a customer and assign an available card.</li>
              <li>3. Record purchases or redeems through the transactions endpoint.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Inventory</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Available cards</span><span>{store.cards.filter((card) => card.status === 'AVAILABLE').length}</span></div>
              <div className="flex justify-between"><span>Assigned cards</span><span>{store.cards.filter((card) => card.status === 'ASSIGNED').length}</span></div>
              <div className="flex justify-between"><span>Customers</span><span>{store.customers.length}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { readStore } from '@/lib/data-store';
import { enrollCustomer } from '@/app/actions/customer-actions';

export default async function EnrollCustomerPage() {
  const store = await readStore();
  const availableCards = store.cards.filter((card) => card.status === 'AVAILABLE');

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Enrollment</p>
            <h1 className="text-3xl font-semibold">Register a new customer</h1>
          </div>
          <Link href="/workflows" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to workflows
          </Link>
        </div>

        <form action={enrollCustomer} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              First name
              <input name="first_name" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Last name
              <input name="last_name" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input name="phone" required className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input type="email" name="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Assign card
            <select name="card_id" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
              <option value="">No card yet</option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_number}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Create customer
          </button>
        </form>
      </div>
    </main>
  );
}

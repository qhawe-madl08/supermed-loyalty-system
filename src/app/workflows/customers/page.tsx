import Link from 'next/link';
import { getRepository } from '@/lib/db';
import { formatCustomerName } from '@/lib/workflow';

export const dynamic = 'force-dynamic';

interface CustomersPageProps {
  searchParams: { q?: string };
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const repository = getRepository();
  const query = searchParams.q?.trim() ?? '';
  const customers = query ? await repository.searchCustomers(query) : await repository.listCustomers();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Customers</p>
            <h1 className="text-3xl font-semibold">Find a customer</h1>
          </div>
          <Link href="/workflows/enroll" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Register customer
          </Link>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:gap-3">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, phone, or card number"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <button type="submit" className="mt-3 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:mt-0 sm:w-auto">
            Search
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {customers.length === 0 ? (
            <p className="text-sm text-slate-500">
              {query ? `No customers match “${query}”.` : 'No customers registered yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Balance</th>
                    <th className="pb-2 font-medium">Card</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium">{formatCustomerName(customer)}</td>
                      <td className="py-3 text-slate-600">{customer.phone}</td>
                      <td className="py-3 font-semibold text-blue-600">{customer.points_balance} pts</td>
                      <td className="py-3 text-slate-600">{customer.card_id ? 'Linked' : 'No card'}</td>
                      <td className="py-3">
                        <Link href={`/workflows/customers/${customer.id}`} className="font-medium text-blue-600 underline">
                          Open
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

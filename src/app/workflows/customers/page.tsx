import Link from 'next/link';
import { listCustomers } from '@/services/customer/customer.repository.json';
import type { LegacyCustomerRecord } from '@/types';

export default async function CustomersPage() {
  const customers = (await listCustomers()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Customer Management</h1>
                <p className="text-xs text-slate-500">Search and manage loyalty members</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link href="/workflows" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                Workflows
              </Link>
              <Link href="/workflows/enroll" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                Enroll Customer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">All Customers</h2>
                <p className="text-sm text-slate-600">{customers.length} {customers.length === 1 ? 'customer' : 'customers'} enrolled</p>
              </div>
              <Link href="/workflows/enroll" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                <span className="mr-2">+</span> Enroll Customer
              </Link>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No customers yet</h3>
              <p className="text-slate-600 mb-4">Start enrolling customers to build your loyalty program.</p>
              <Link href="/workflows/enroll" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                Enroll first customer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Card Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer: LegacyCustomerRecord) => (
                    <tr key={customer.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{customer.phone}</div>
                        <div className="text-xs text-slate-500">{customer.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-semibold text-blue-600">{customer.points_balance}</div>
                        <div className="text-xs text-slate-500">points</div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.card_id ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <span className="mr-1">✓</span> Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            No card
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/workflows/customers/${customer.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                        >
                          View details →
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
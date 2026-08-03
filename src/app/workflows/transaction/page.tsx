export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { listCustomers } from '@/services/customer/customer.repository';
import { TransactionForm } from './transaction-form';
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

        <TransactionForm customers={customers} />
      </div>
    </main>
  );
}

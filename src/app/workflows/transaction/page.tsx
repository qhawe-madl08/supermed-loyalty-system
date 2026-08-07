export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MobileNavigation } from '@/components/mobile-navigation';
import { listCustomers, getCustomerById } from '@/services/customer/customer.repository';
import { TransactionForm } from './transaction-form';
import type { LegacyCustomerRecord } from '@/types';

interface PageProps {
  searchParams: Promise<{ customer?: string; type?: string }>;
}

export default async function TransactionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const customers = (await listCustomers()).sort((a, b) =>
    `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  );

  let preselectedCustomer: LegacyCustomerRecord | null = null;
  if (params.customer) {
    preselectedCustomer = await getCustomerById(params.customer);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo currentRole="cashier" size="md" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Transaction</h1>
                <p className="text-xs text-slate-500">Record purchase or redemption</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop back button */}
              <Link href="/scan" className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition">
                Back to Scan
              </Link>
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileNavigation currentRole="cashier" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            {preselectedCustomer ? `Transaction for ${preselectedCustomer.first_name} ${preselectedCustomer.last_name}` : 'Record Transaction'}
          </h2>
        </div>

        <TransactionForm 
          customers={customers} 
          preselectedCustomer={preselectedCustomer}
          transactionType={params.type}
        />
      </div>
    </main>
  );
}

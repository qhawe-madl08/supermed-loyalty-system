import Link from 'next/link';
import { EnrollCustomerForm } from './enroll-customer-form';

interface PageProps {
  searchParams: { card?: string };
}

export default async function EnrollCustomerPage({ searchParams }: PageProps) {
  const cardCode = searchParams.card;

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Enrollment</p>
            <h1 className="text-3xl font-semibold">
              {cardCode ? `Register for card ${cardCode}` : 'Register a new customer'}
            </h1>
          </div>
          <Link href="/scan" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600">
            Back to Scan
          </Link>
        </div>

        <EnrollCustomerForm cardCode={cardCode} />
      </div>
    </main>
  );
}

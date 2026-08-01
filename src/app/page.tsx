import Link from 'next/link';

const links = [
  { href: '/api/v1/health', label: 'Health Check' },
  { href: '/api/v1/customers/enroll', label: 'Customer Enrollment' },
  { href: '/api/v1/transactions', label: 'Transactions' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Supermed Loyalty MVP</p>
          <h1 className="mt-3 text-3xl font-semibold">Pharmacy loyalty operations for staff</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Register customers, assign cards, award points, and record redeems in a simple workflow built for in-store use.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:text-blue-600">
              <h2 className="font-medium">{link.label}</h2>
              <p className="mt-2 text-sm text-slate-500">Open the endpoint to inspect the current MVP behavior.</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

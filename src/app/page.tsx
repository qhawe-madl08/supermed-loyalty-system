import Link from 'next/link';

const links = [
  { href: '/workflows/enroll', label: 'Register customer', description: 'Add a new customer and hand them a loyalty card.' },
  { href: '/workflows/customers', label: 'Find customer', description: 'Search by name, phone number, or card number.' },
  { href: '/dashboard', label: 'Dashboard', description: "Review today's registrations, purchases, and points." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 sm:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-100">Supermed Loyalty</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Loyalty operations for pharmacy staff</h1>
          <p className="mt-4 max-w-2xl text-base text-blue-50">
            Register customers, assign loyalty cards, record purchases, and redeem points from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
              Open dashboard
            </Link>
            <Link href="/workflows" className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Staff workflows
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{link.label}</h2>
              <p className="mt-2 text-sm text-slate-600">{link.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

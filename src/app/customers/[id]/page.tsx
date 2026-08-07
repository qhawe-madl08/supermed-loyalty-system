'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { MobileNavigation } from '@/components/mobile-navigation';

interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  points_balance: number;
  card_id: string | null;
  created_at: string;
}

interface TransactionData {
  id: string;
  transaction_type: 'PURCHASE' | 'REDEMPTION' | 'MANUAL_ADJUSTMENT';
  points: number;
  purchase_amount: number | null;
  created_at: string;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [customerId, setCustomerId] = useState<string>('');

  useEffect(() => {
    params.then(p => setCustomerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!customerId) return;

    const loadCustomer = async () => {
      try {
        setLoading(true);
        setError(null);

        const [customerRes, transactionsRes] = await Promise.all([
          fetch(`/api/customers/${customerId}`),
          fetch(`/api/customers/${customerId}/transactions`),
        ]);

        if (!customerRes.ok) {
          throw new Error('Failed to load customer');
        }

        const customerData = await customerRes.json();
        setCustomer(customerData);

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setTransactions(transactionsData);
        }
      } catch (err) {
        setError('Failed to load customer data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <p className="text-red-600 mb-4">{error || 'Customer not found'}</p>
            <Link
              href="/scan"
              className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Scan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/scan')}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ← Back
              </button>
              <Logo currentRole="cashier" size="sm" />
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop scan button */}
              <Link
                href="/scan"
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Scan Card
              </Link>
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileNavigation currentRole="cashier" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Customer Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-slate-600">{customer.phone}</p>
              {customer.email && <p className="text-sm text-slate-500">{customer.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Card</p>
              <p className="font-mono text-lg font-medium text-slate-900">
                {customer.card_id || 'Not assigned'}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Points Balance</p>
            <p className="text-4xl font-bold">{customer.points_balance.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-3 mb-6">
          <button
            onClick={() => router.push(`/workflows/transaction?customer=${customer.id}`)}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-lg"
          >
            Add Purchase
          </button>
          <button
            onClick={() => router.push(`/workflows/transaction?customer=${customer.id}&type=redemption`)}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-medium text-lg"
          >
            Redeem Reward
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="w-full bg-slate-100 text-slate-700 py-4 px-6 rounded-xl hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium text-lg"
          >
            View History
          </button>
        </div>

        {/* Recent Activity */}
        {activeTab === 'profile' && transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {txn.transaction_type === 'PURCHASE' ? 'Purchase' : 'Redemption'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        txn.points > 0 ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {txn.points > 0 ? '+' : ''}
                      {txn.points}
                    </p>
                    {txn.purchase_amount && (
                      <p className="text-sm text-slate-500">
                        ${txn.purchase_amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="w-full mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              View All Activity →
            </button>
          </div>
        )}

        {/* Full History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
              >
                Back to Profile
              </button>
            </div>
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {txn.transaction_type === 'PURCHASE' ? 'Purchase' : 'Redemption'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          txn.points > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {txn.points > 0 ? '+' : ''}
                        {txn.points}
                      </p>
                      {txn.purchase_amount && (
                        <p className="text-sm text-slate-500">
                          ${txn.purchase_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

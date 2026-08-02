'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { listCustomers } from '@/services/customer/customer.repository.json';
import { listTransactions } from '@/services/transactions/transaction.repository.json';
import { listCards } from '@/services/cards/card.repository.json';
import type { LegacyCustomerRecord, LegacyTransactionRecord } from '@/types';
import { UserMenu } from '@/components/user-menu';

export default function DashboardPage() {
  const [customers, setCustomers] = useState<LegacyCustomerRecord[]>([]);
  const [allTransactions, setAllTransactions] = useState<LegacyTransactionRecord[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, transactionsData, cardsData] = await Promise.all([
          listCustomers(),
          listTransactions(),
          listCards()
        ]);
        setCustomers(customersData);
        setAllTransactions(transactionsData);
        setCards(cardsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const lastUpdated = new Date().toLocaleString();

  // Calculate summary
  const todayTransactions = allTransactions.filter((t) => t.created_at.startsWith(today));
  const todayCustomers = customers.filter((c) => c.created_at.startsWith(today));

  const summary = {
    newCustomers: todayCustomers.length,
    purchaseCount: todayTransactions.filter((t) => t.transaction_type === 'PURCHASE').length,
    pointsIssued: todayTransactions.filter((t) => t.points > 0).reduce((sum, t) => sum + t.points, 0),
    pointsRedeemed: Math.abs(todayTransactions.filter((t) => t.points < 0).reduce((sum, t) => sum + t.points, 0)),
    availableCards: cards.filter((c) => c.status === 'AVAILABLE').length,
    assignedCards: cards.filter((c) => c.status === 'ASSIGNED').length,
    totalCustomers: customers.length,
  };

  const recentTransactions = allTransactions.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="relative w-10 h-10">
                <Image
                  src="/media/logo.png"
                  alt="Supermed Pharmacy Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Supermed Loyalty Platform</h1>
                <p className="text-xs text-slate-500">Customer Loyalty Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-2">
                <Link href="/workflows" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  Workflows
                </Link>
                <Link href="/workflows/customers" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  Customers
                </Link>
                <Link href="/workflows/transaction" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition">
                  Record Transaction
                </Link>
              </nav>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-600">Here's what's happening with your loyalty program today.</p>
          <p className="text-xs text-slate-400 mt-1">Last updated: {lastUpdated}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { 
              label: "Today's Registrations", 
              value: summary.newCustomers, 
              empty: summary.newCustomers === 0,
              icon: '👤',
              color: 'blue'
            },
            { 
              label: "Today's Purchases", 
              value: summary.purchaseCount, 
              empty: summary.purchaseCount === 0,
              icon: '🛒',
              color: 'green'
            },
            { 
              label: 'Points Issued', 
              value: summary.pointsIssued, 
              empty: summary.pointsIssued === 0,
              icon: '✨',
              color: 'purple'
            },
            { 
              label: 'Points Redeemed', 
              value: summary.pointsRedeemed, 
              empty: summary.pointsRedeemed === 0,
              icon: '🎁',
              color: 'amber'
            },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  item.empty ? 'bg-slate-100 text-slate-500' : 
                  item.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  item.color === 'green' ? 'bg-green-100 text-green-700' :
                  item.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.empty ? 'No data' : 'Today'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{item.label}</p>
              <p className={`text-3xl font-bold ${item.empty ? 'text-slate-300' : 'text-slate-900'}`}>
                {item.empty ? '—' : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
                <Link href="/workflows/transaction" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  View all →
                </Link>
              </div>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">No transactions yet</h4>
                <p className="text-slate-600 mb-4">Start recording transactions to see activity here.</p>
                <Link href="/workflows/transaction" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                  Record first transaction
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.map((transaction: LegacyTransactionRecord) => {
                      const customer = customers.find((c: LegacyCustomerRecord) => c.id === transaction.customer_id);
                      return (
                        <tr key={transaction.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">
                              {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {transaction.transaction_type === 'PURCHASE' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Purchase
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Redemption
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.purchase_amount ? `$${transaction.purchase_amount.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {transaction.balance_after} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions & Inventory */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/workflows/enroll" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition group">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                    <span className="text-lg">➕</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Enroll Customer</p>
                    <p className="text-xs text-slate-500">Register new loyalty member</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link href="/workflows/transaction" className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition group">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition">
                    <span className="text-lg">💳</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Record Transaction</p>
                    <p className="text-xs text-slate-500">Log purchase or redemption</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link href="/workflows/customers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition group">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition">
                    <span className="text-lg">🔍</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Search Customers</p>
                    <p className="text-xs text-slate-500">Find existing members</p>
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>

            {/* Card Inventory */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Card Inventory</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Available</p>
                      <p className="text-xs text-slate-500">Ready for assignment</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-700">{summary.availableCards}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Assigned</p>
                      <p className="text-xs text-slate-500">With customers</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-700">{summary.assignedCards}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">👥</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Total Customers</p>
                      <p className="text-xs text-slate-500">Active members</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-slate-700">{summary.totalCustomers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

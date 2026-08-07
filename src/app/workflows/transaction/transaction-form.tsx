'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recordTransaction } from '@/app/actions/transaction-actions';
import { ActionResult } from '@/lib/action-response';
import { generateIdempotencyKey } from '@/lib/idempotency';
import type { LegacyCustomerRecord, LegacyTransactionRecord } from '@/types';

interface TransactionFormProps {
  customers: LegacyCustomerRecord[];
  preselectedCustomer?: LegacyCustomerRecord | null;
  transactionType?: string;
}

export function TransactionForm({ customers, preselectedCustomer, transactionType }: TransactionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomer?.id || '',
    transaction_type: (transactionType === 'redemption' ? 'REDEMPTION' : 'PURCHASE') as 'PURCHASE' | 'REDEMPTION',
    amount: '',
    points: '',
    notes: '',
    idempotency_key: generateIdempotencyKey(),
  });

  // Update transaction type if it changes from props
  useEffect(() => {
    if (transactionType) {
      setFormData(prev => ({
        ...prev,
        transaction_type: transactionType === 'redemption' ? 'REDEMPTION' : 'PURCHASE'
      }));
    }
  }, [transactionType]);

  // Update customer_id if preselectedCustomer changes
  useEffect(() => {
    if (preselectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customer_id: preselectedCustomer.id
      }));
    }
  }, [preselectedCustomer]);

  const [successData, setSuccessData] = useState<LegacyTransactionRecord | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSuccessData(null);

    const formDataObj = new FormData(e.currentTarget);
    const result: ActionResult<LegacyTransactionRecord> = await recordTransaction(formDataObj);

    if (result.success) {
      setSuccess(true);
      setSuccessData(result.data || null);
      setTimeout(() => {
        if (formData.customer_id) {
          router.push(`/customers/${formData.customer_id}`);
        } else {
          router.push('/scan');
        }
      }, 2000);
    } else {
      setError(result.message || 'An error occurred');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <>
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600">✓</span>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Transaction recorded successfully!</p>
            {successData && (
              <p className="text-xs text-green-700">
                {successData.transaction_type === 'PURCHASE' 
                  ? `+${successData.points} points earned` 
                  : `${successData.points} points redeemed`}
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600">!</span>
          </div>
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="customer_id" className="block text-sm font-medium text-slate-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <select 
                id="customer_id"
                name="customer_id" 
                required 
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                <option value="">Select a customer</option>
                {customers.map((customer: LegacyCustomerRecord) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} ({customer.phone}) — {customer.points_balance} pts
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="transaction_type" className="block text-sm font-medium text-slate-700">
                Transaction type <span className="text-red-500">*</span>
              </label>
              <select 
                id="transaction_type"
                name="transaction_type" 
                required 
                value={formData.transaction_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                <option value="PURCHASE">Purchase (earn points)</option>
                <option value="REDEMPTION">Redemption (spend points)</option>
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Selected Customer</p>
                  <p className="text-xs text-blue-700">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-900">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedCustomer.points_balance} pts</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                Purchase amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={formData.transaction_type === 'REDEMPTION'}
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <p className="text-xs text-slate-500">Required for purchases. Points calculated automatically.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="points" className="block text-sm font-medium text-slate-700">
                Points to redeem
              </label>
              <input
                id="points"
                type="number"
                name="points"
                step="1"
                min="1"
                placeholder="0"
                value={formData.points}
                onChange={handleChange}
                disabled={formData.transaction_type === 'PURCHASE'}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-xs text-slate-500">Required for redemptions.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea 
              id="notes"
              name="notes" 
              rows={3} 
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
            />
          </div>
        </div>

        <input type="hidden" name="idempotency_key" value={formData.idempotency_key} />

        <div className="mt-8 flex items-center justify-between">
          <Link href="/workflows" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">
            Record Transaction
          </button>
        </div>
      </form>
    </>
  );
}

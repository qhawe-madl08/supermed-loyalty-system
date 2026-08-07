'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { enrollCustomer } from '@/app/actions/customer-actions';
import { ActionResult } from '@/lib/action-response';
import type { LegacyCustomerRecord } from '@/types';

interface EnrollCustomerFormProps {
  cardCode?: string;
}

export function EnrollCustomerForm({ cardCode }: EnrollCustomerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formDataObj = new FormData(e.currentTarget);
    if (cardCode) {
      formDataObj.append('card_code', cardCode);
    }
    const result: ActionResult<LegacyCustomerRecord> = await enrollCustomer(formDataObj);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/scan');
      }, 1500);
    } else {
      setError(result.message || 'An error occurred');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      {cardCode && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-900">
            Scanned Card: <span className="font-mono">{cardCode}</span>
          </p>
          <p className="text-xs text-blue-700 mt-1">
            This card will be assigned to the customer upon registration.
          </p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600">✓</span>
          </div>
          <p className="text-sm font-medium text-green-800">
            {cardCode ? 'Customer registered and card assigned.' : 'Customer enrolled and loyalty card issued.'} Redirecting...
          </p>
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
              <label htmlFor="first_name" className="block text-sm font-medium text-slate-700">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="last_name" className="block text-sm font-medium text-slate-700">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+263 XXX XXX XXX"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="customer@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            A QR loyalty card will be automatically issued to this customer upon enrollment.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/workflows" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">
            Enroll Customer
          </button>
        </div>
      </form>
    </>
  );
}

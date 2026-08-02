'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollCustomer } from '@/app/actions/customer-actions';
import { ActionResult } from '@/lib/action-response';
import type { LegacyCardRecord } from '@/types';

interface EnrollCustomerFormProps {
  availableCards: LegacyCardRecord[];
}

export function EnrollCustomerForm({ availableCards }: EnrollCustomerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    card_id: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formDataObj = new FormData(e.currentTarget);
    const result: ActionResult = await enrollCustomer(formDataObj);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/workflows');
      }, 1500);
    } else {
      setError(result.message || 'An error occurred');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600">✓</span>
          </div>
          <p className="text-sm font-medium text-green-800">Customer created successfully! Redirecting...</p>
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

          <div className="space-y-2">
            <label htmlFor="card_id" className="block text-sm font-medium text-slate-700">
              Assign loyalty card
            </label>
            <select 
              id="card_id"
              name="card_id" 
              value={formData.card_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            >
              <option value="">No card assigned</option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_number}
                </option>
              ))}
            </select>
            {availableCards.length === 0 && (
              <p className="text-xs text-slate-500">No cards available. Contact administrator to register cards.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/workflows" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">
            Create Customer
          </button>
        </div>
      </form>
    </>
  );
}

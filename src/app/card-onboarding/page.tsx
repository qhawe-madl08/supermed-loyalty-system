'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PageProps {
  searchParams: Promise<{ card: string }>;
}

export default function CardOnboardingPage({ searchParams }: PageProps) {
  const router = useRouter();
  const [cardCode, setCardCode] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      const params = await searchParams;
      setCardCode(params.card || '');
    };
    loadParams();
  }, [searchParams]);

  const handleRegister = () => {
    router.push(`/workflows/enroll?card=${cardCode}`);
  };

  const handleCheckCard = () => {
    // For now, just go back to scan
    // In the future, this could show card details/history
    router.push('/scan');
  };

  const handleCancel = () => {
    router.push('/scan');
  };

  if (!cardCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-md w-full">
          <p className="text-slate-600 mb-4">No card specified.</p>
          <button
            onClick={() => router.push('/scan')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Scan
          </button>
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
              <div className="relative w-10 h-10">
                <Image
                  src="/media/logo.png"
                  alt="Supermed Pharmacy Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Supermed Loyalty</h1>
                <p className="text-xs text-slate-500">Card Onboarding</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {/* Card Info */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-6">
            <p className="text-sm opacity-90 mb-1">Card Number</p>
            <p className="text-3xl font-bold font-mono">{cardCode}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <p className="text-sm font-medium">Available</p>
            </div>
          </div>

          <p className="text-slate-600 mb-6">
            This card is available and has not been assigned to a customer.
          </p>

          <h3 className="text-lg font-semibold text-slate-900 mb-4">What would you like to do?</h3>

          <div className="space-y-3">
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-lg"
            >
              Register Customer
            </button>
            <p className="text-xs text-slate-500 text-center">Assign this card to a new customer</p>

            <button
              onClick={handleCheckCard}
              className="w-full bg-slate-100 text-slate-700 py-4 px-4 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium text-lg"
            >
              Check Card
            </button>
            <p className="text-xs text-slate-500 text-center">View card status and details</p>

            <button
              onClick={handleCancel}
              className="w-full border border-slate-300 text-slate-700 py-4 px-4 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium text-lg"
            >
              Cancel
            </button>
            <p className="text-xs text-slate-500 text-center">Return to scanner</p>
          </div>
        </div>
      </div>
    </div>
  );
}

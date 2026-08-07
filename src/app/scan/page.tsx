'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import Image from 'next/image';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardCode, setCardCode] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'reader';

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode(readerElementId);
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors during active scanning
        }
      );
    } catch (err) {
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = (decodedText: string) => {
    stopScanning();
    setCardCode(decodedText);
    handleCardLookup(decodedText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardCode.trim()) {
      handleCardLookup(cardCode.trim());
    }
  };

  const handleCardLookup = async (code: string) => {
    try {
      const response = await fetch(`/api/cards/lookup?code=${encodeURIComponent(code)}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Card lookup failed');
        return;
      }

      if (result.status === 'available') {
        router.push(`/customers/register?card=${code}`);
      } else if (result.status === 'active') {
        router.push(`/customers/${result.customer_id}`);
      } else {
        setError(`Card is ${result.status}. Please contact your manager.`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

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
                <p className="text-xs text-slate-500">Scan Card</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Scan Loyalty Card</h2>
          <p className="text-slate-600 mb-6">
            Scan a physical Supermed loyalty card or enter the card number manually.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!manualMode ? (
            <>
              <div id={readerElementId} className="w-full bg-slate-100 rounded-lg overflow-hidden mb-6" style={{ minHeight: '300px' }}></div>

              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full bg-slate-600 text-white py-3 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium"
                >
                  Stop Camera
                </button>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => setManualMode(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Enter card number manually
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label htmlFor="cardCode" className="block text-sm font-medium text-slate-700 mb-2">
                    Card Number
                  </label>
                  <input
                    id="cardCode"
                    type="text"
                    value={cardCode}
                    onChange={(e) => setCardCode(e.target.value)}
                    placeholder="SM000025"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                >
                  Look Up Card
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setManualMode(false)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  Use camera instead
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How it works</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Scan the QR code on a physical Supermed card</li>
            <li>• If card is available: Register new customer</li>
            <li>• If card is assigned: View customer profile</li>
            <li>• Cards contain only the card number (no personal data)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

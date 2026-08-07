'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Image from 'next/image';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardCode, setCardCode] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current = null;
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanning(true);
    setScanSuccess(false);

    try {
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Try to get the rear camera first
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const rearCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      );

      const selectedDeviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0]?.deviceId;

      if (!selectedDeviceId) {
        throw new Error('No camera available');
      }

      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            onScanSuccess(result.getText());
          }
          // Ignore scan errors during active scanning
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to start camera. Please check permissions and try again.');
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    setScanning(false);
    // Reset the reader reference to stop scanning
    readerRef.current = null;
  };

  const onScanSuccess = (decodedText: string) => {
    if (scanSuccess) return; // Prevent duplicate scans

    setScanSuccess(true);
    stopScanning();
    setCardCode(decodedText);
    
    // Vibrate on success if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Short delay to show success feedback
    setTimeout(() => {
      handleCardLookup(decodedText);
    }, 500);
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
        if (response.status === 404) {
          setError('Card not recognized. This card is not registered in the Supermed system.');
        } else {
          setError(result.error || 'Card lookup failed');
        }
        setScanSuccess(false);
        return;
      }

      if (result.status === 'available') {
        router.push(`/card-onboarding?card=${code}`);
      } else if (result.status === 'active') {
        router.push(`/customers/${result.customer_id}`);
      } else if (result.status === 'lost') {
        setError('This card has been reported as lost. Please contact your manager.');
        setScanSuccess(false);
      } else if (result.status === 'frozen') {
        setError('This card is temporarily frozen. Please contact your manager.');
        setScanSuccess(false);
      } else if (result.status === 'replaced') {
        setError('This card has been replaced. Please contact your manager.');
        setScanSuccess(false);
      } else if (result.status === 'revoked') {
        setError('This card has been revoked. Please contact your manager.');
        setScanSuccess(false);
      } else {
        setError(`Card is ${result.status}. Please contact your manager.`);
        setScanSuccess(false);
      }
    } catch (err) {
      console.error('Card lookup error:', err);
      setError('Network error. Please try again.');
      setScanSuccess(false);
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

          {scanSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800">Card detected: {cardCode}</p>
            </div>
          )}

          {!manualMode ? (
            <>
              <div className="relative w-full bg-slate-900 rounded-lg overflow-hidden mb-6" style={{ minHeight: '300px' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                    <p className="text-white text-sm">Camera stopped</p>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-4 border-white/50 rounded-lg" />
                  </div>
                )}
              </div>

              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-lg"
                >
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full bg-slate-600 text-white py-4 px-4 rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium text-lg"
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
                    placeholder="SM000001"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-lg"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium text-lg"
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

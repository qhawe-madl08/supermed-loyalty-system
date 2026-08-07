'use client';

import { useState, useEffect } from 'react';

interface AbandonmentDialogProps {
  when: boolean;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AbandonmentDialog({ when, message = "You have unsaved changes. Leave without saving?", onConfirm, onCancel }: AbandonmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (when) {
      setIsOpen(true);
    }
  }, [when]);

  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Leave without saving?</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            Continue Editing
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}

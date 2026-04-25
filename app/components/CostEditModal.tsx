'use client';

import { useState, useEffect } from 'react';
import { Currency } from '../../lib/currency';
import CostInput from './CostInput';

interface CostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: string, currency: Currency, numPeople: number) => void;
  initialAmount: string;
  initialCurrency: Currency;
  initialNumPeople: number;
}

export default function CostEditModal({
  isOpen,
  onClose,
  onSave,
  initialAmount,
  initialCurrency,
  initialNumPeople,
}: CostEditModalProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [numPeople, setNumPeople] = useState(initialNumPeople);

  useEffect(() => {
    if (isOpen) {
      setAmount(initialAmount);
      setCurrency(initialCurrency);
      setNumPeople(initialNumPeople);
    }
  }, [isOpen, initialAmount, initialCurrency, initialNumPeople]);

  const handleSave = () => {
    onSave(amount, currency, numPeople);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">💰 비용 수정</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
          >
            ×
          </button>
        </div>

        {/* Cost Input */}
        <div className="space-y-4">
          <CostInput
            amount={amount}
            currency={currency}
            numPeople={numPeople}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
            onNumPeopleChange={setNumPeople}
            placeholder="50,000"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

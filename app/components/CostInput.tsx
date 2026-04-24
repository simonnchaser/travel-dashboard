'use client';

import { useState, useEffect } from 'react';
import { Currency, currencyLabels, convertCurrency, formatCurrency } from '../../lib/currency';

interface CostInputProps {
  amount: string;
  currency: Currency;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  label?: string;
  placeholder?: string;
}

export default function CostInput({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  label = '금액',
  placeholder = '0',
}: CostInputProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function convert() {
      const numAmount = parseFloat(amount.replace(/,/g, ''));

      if (!numAmount || isNaN(numAmount) || currency === 'KRW') {
        setConvertedAmount(null);
        return;
      }

      setLoading(true);
      const result = await convertCurrency(numAmount, currency, 'KRW');
      setConvertedAmount(result);
      setLoading(false);
    }

    convert();
  }, [amount, currency]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="flex gap-2">
        {/* Amount Input */}
        <input
          type="text"
          value={amount}
          onChange={(e) => {
            // Allow only numbers and commas
            const value = e.target.value.replace(/[^0-9,]/g, '');
            onAmountChange(value);
          }}
          placeholder={placeholder}
          className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        {/* Currency Selector */}
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as Currency)}
          className="w-32 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {(Object.keys(currencyLabels) as Currency[]).map((curr) => (
            <option key={curr} value={curr}>
              {currencyLabels[curr]}
            </option>
          ))}
        </select>
      </div>

      {/* Conversion Display */}
      {currency !== 'KRW' && convertedAmount !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">≈</span>
          <span className="font-semibold text-indigo-600">
            {formatCurrency(convertedAmount, 'KRW')}
          </span>
          {loading && <span className="text-gray-400 text-xs">(환율 업데이트 중...)</span>}
        </div>
      )}

      {currency !== 'KRW' && amount && !convertedAmount && !loading && (
        <div className="text-xs text-red-500">
          환율 정보를 불러올 수 없습니다
        </div>
      )}
    </div>
  );
}

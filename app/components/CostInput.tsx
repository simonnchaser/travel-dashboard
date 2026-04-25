'use client';

import { useState, useEffect } from 'react';
import { Currency, currencyLabels, convertCurrency, formatCurrency } from '../../lib/currency';

interface CostInputProps {
  amount: string;
  currency: Currency;
  numPeople?: number;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  onNumPeopleChange?: (numPeople: number) => void;
  label?: string;
  placeholder?: string;
}

export default function CostInput({
  amount,
  currency,
  numPeople = 1,
  onAmountChange,
  onCurrencyChange,
  onNumPeopleChange,
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

  // Calculate total cost
  const numAmount = parseFloat(amount.replace(/,/g, ''));
  const totalCost = numAmount && !isNaN(numAmount) ? numAmount * numPeople : 0;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Amount Input (per person) */}
        <div className="flex-1">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              // Allow only numbers and commas
              const value = e.target.value.replace(/[^0-9,]/g, '');
              onAmountChange(value);
            }}
            placeholder={placeholder}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <div className="text-xs text-gray-500 mt-1">인당 비용</div>
        </div>

        {/* Number of People and Currency - Row on mobile */}
        <div className="flex gap-2">
          {/* Number of People */}
          {onNumPeopleChange && (
            <div className="flex-1 sm:w-24">
              <input
                type="number"
                min="1"
                value={numPeople}
                onChange={(e) => onNumPeopleChange(parseInt(e.target.value) || 1)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">인원</div>
            </div>
          )}

          {/* Currency Selector */}
          <div className="flex-1 sm:w-32">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {(Object.keys(currencyLabels) as Currency[]).map((curr) => (
                <option key={curr} value={curr}>
                  {currencyLabels[curr]}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1 text-center sm:hidden">통화</div>
          </div>
        </div>
      </div>

      {/* Total Cost Display */}
      {onNumPeopleChange && totalCost > 0 && numPeople > 1 && (
        <div className="flex items-center gap-2 text-sm bg-indigo-50 p-2 rounded-lg">
          <span className="text-gray-600">총 비용:</span>
          <span className="font-bold text-indigo-700">
            {formatCurrency(totalCost, currency)}
          </span>
          <span className="text-xs text-gray-500">({numPeople}명)</span>
        </div>
      )}

      {/* Conversion Display */}
      {currency !== 'KRW' && convertedAmount !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">≈</span>
          <span className="font-semibold text-indigo-600">
            {formatCurrency(convertedAmount * numPeople, 'KRW')}
          </span>
          <span className="text-xs text-gray-500">
            ({formatCurrency(convertedAmount, 'KRW')} × {numPeople}명)
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

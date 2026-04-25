'use client';

import { useEffect, useState } from 'react';
import { Currency, formatCurrency, convertCurrency } from '../../lib/currency';

interface CostDisplayProps {
  amount: string | null;
  currency?: string;
  numPeople?: number;
}

export default function CostDisplay({ amount, currency = 'KRW', numPeople = 1 }: CostDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    async function convert() {
      if (!amount || currency === 'KRW') {
        setConvertedAmount(null);
        return;
      }

      const perPersonAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(perPersonAmount)) {
        setConvertedAmount(null);
        return;
      }

      // Convert per-person amount to KRW
      const result = await convertCurrency(perPersonAmount, currency as Currency, 'KRW');
      setConvertedAmount(result);
    }

    convert();
  }, [amount, currency]);

  if (!amount) {
    return <span className="text-gray-400">-</span>;
  }

  const perPersonAmount = parseFloat(amount.replace(/,/g, ''));
  if (isNaN(perPersonAmount)) {
    return <span className="text-gray-600">{amount}</span>;
  }

  // Calculate total cost
  const totalAmount = perPersonAmount * numPeople;
  const formattedTotal = formatCurrency(totalAmount, (currency as Currency) || 'KRW');
  const formattedPerPerson = formatCurrency(perPersonAmount, (currency as Currency) || 'KRW');

  // If currency is KRW, show total cost
  if (currency === 'KRW') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-gray-600 font-medium">{formattedTotal}</span>
        {numPeople > 1 && (
          <span className="text-xs text-gray-500">
            {formattedPerPerson} × {numPeople}명
          </span>
        )}
      </div>
    );
  }

  // For other currencies, show both original and converted (with total)
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-600 font-medium">{formattedTotal}</span>
      {numPeople > 1 && (
        <span className="text-xs text-gray-500">
          {formattedPerPerson} × {numPeople}명
        </span>
      )}
      {convertedAmount !== null && (
        <span className="text-sm text-indigo-600">
          ≈ {formatCurrency(convertedAmount * numPeople, 'KRW')}
        </span>
      )}
    </div>
  );
}

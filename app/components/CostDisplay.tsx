'use client';

import { useEffect, useState } from 'react';
import { Currency, formatCurrency, convertCurrency } from '../../lib/currency';

interface CostDisplayProps {
  amount: string | null;
  currency?: string;
}

export default function CostDisplay({ amount, currency = 'KRW' }: CostDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);

  useEffect(() => {
    async function convert() {
      if (!amount || currency === 'KRW') {
        setConvertedAmount(null);
        return;
      }

      const numAmount = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(numAmount)) {
        setConvertedAmount(null);
        return;
      }

      const result = await convertCurrency(numAmount, currency as Currency, 'KRW');
      setConvertedAmount(result);
    }

    convert();
  }, [amount, currency]);

  if (!amount) {
    return <span className="text-gray-400">-</span>;
  }

  const numAmount = parseFloat(amount.replace(/,/g, ''));
  if (isNaN(numAmount)) {
    return <span className="text-gray-600">{amount}</span>;
  }

  const formattedAmount = formatCurrency(numAmount, (currency as Currency) || 'KRW');

  // If currency is KRW, just show the amount
  if (currency === 'KRW') {
    return <span className="text-gray-600 font-medium">{formattedAmount}</span>;
  }

  // For other currencies, show both original and converted
  return (
    <div className="flex flex-col gap-1">
      <span className="text-gray-600 font-medium">{formattedAmount}</span>
      {convertedAmount !== null && (
        <span className="text-sm text-indigo-600">
          ≈ {formatCurrency(convertedAmount, 'KRW')}
        </span>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ScheduleItem } from '../types/schedule';
import { convertCurrency, formatCurrency, Currency } from '../../lib/currency';

interface CostKpiDashboardProps {
  schedules: ScheduleItem[];
}

interface CostByCurrency {
  [key: string]: number;
}

interface CostByCategory {
  accommodation: number;
  dining: number;
  activity: number;
  transport: number;
  tour: number;
}

interface CostByCity {
  [key: string]: number;
}

const categoryLabels = {
  accommodation: '숙박',
  dining: '식사',
  activity: '액티비티',
  transport: '교통',
  tour: '투어',
};

export default function CostKpiDashboard({ schedules }: CostKpiDashboardProps) {
  const [totalCostKRW, setTotalCostKRW] = useState<number>(0);
  const [costByCurrency, setCostByCurrency] = useState<CostByCurrency>({});
  const [costByCategory, setCostByCategory] = useState<CostByCategory>({
    accommodation: 0,
    dining: 0,
    activity: 0,
    transport: 0,
    tour: 0,
  });
  const [costByCity, setCostByCity] = useState<CostByCity>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateCosts = async () => {
      setLoading(true);

      let totalKRW = 0;
      const byCurrency: CostByCurrency = {};
      const byCategory: CostByCategory = {
        accommodation: 0,
        dining: 0,
        activity: 0,
        transport: 0,
        tour: 0,
      };
      const byCity: CostByCity = {};

      for (const schedule of schedules) {
        if (!schedule.cost) continue;

        const amount = parseFloat(schedule.cost.replace(/,/g, ''));
        if (isNaN(amount)) continue;

        const currency = (schedule.currency || 'KRW') as Currency;

        // Aggregate by currency
        if (!byCurrency[currency]) {
          byCurrency[currency] = 0;
        }
        byCurrency[currency] += amount;

        // Convert to KRW for total
        const amountInKRW = await convertCurrency(amount, currency, 'KRW');
        if (amountInKRW !== null) {
          totalKRW += amountInKRW;

          // Aggregate by category (in KRW)
          if (schedule.category && byCategory[schedule.category] !== undefined) {
            byCategory[schedule.category] += amountInKRW;
          }

          // Aggregate by city (in KRW)
          if (schedule.city) {
            if (!byCity[schedule.city]) {
              byCity[schedule.city] = 0;
            }
            byCity[schedule.city] += amountInKRW;
          }
        }
      }

      setTotalCostKRW(totalKRW);
      setCostByCurrency(byCurrency);
      setCostByCategory(byCategory);
      setCostByCity(byCity);
      setLoading(false);
    };

    calculateCosts();
  }, [schedules]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <p className="text-gray-500 text-center">비용 계산 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>💰</span>
        <span>여행 비용 요약</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Cost in KRW */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">총 비용 (KRW 환산)</p>
          <p className="text-2xl font-bold text-indigo-600">
            {formatCurrency(totalCostKRW, 'KRW')}
          </p>
        </div>

        {/* Cost by Currency */}
        {Object.entries(costByCurrency).map(([currency, amount]) => (
          <div key={currency} className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">{currency} 총액</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(amount, currency as Currency)}
            </p>
          </div>
        ))}
      </div>

      {/* Cost by Category */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">카테고리별 비용</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(costByCategory).map(([category, amount]) => (
            <div key={category} className="flex flex-col">
              <span className="text-sm text-gray-600">{categoryLabels[category as keyof CostByCategory]}</span>
              <span className="text-lg font-semibold text-purple-600">
                {formatCurrency(amount, 'KRW')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost by City */}
      {Object.keys(costByCity).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">도시별 비용</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(costByCity).map(([city, amount]) => (
              <div key={city} className="flex flex-col">
                <span className="text-sm text-gray-600">{city}</span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(amount, 'KRW')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

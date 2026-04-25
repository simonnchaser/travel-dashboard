'use client';

import { ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';

interface StatsCardProps {
  scheduleData: Record<string, ScheduleItem[]>;
  cities: City[];
  onCityClick?: (cityId: string) => void;
  onReservationFilterClick?: (cityId: string, filter: 'required' | 'completed' | 'unnecessary') => void;
}

export default function StatsCard({ scheduleData, cities, onCityClick, onReservationFilterClick }: StatsCardProps) {
  const stats = cities.map(city => {
    const schedules = scheduleData[city.id] || [];
    const total = schedules.length;
    const pending = schedules.filter(s => s.reservation.status === '예정').length;
    const completed = schedules.filter(s => s.reservation.status === '완료').length;
    const unnecessary = schedules.filter(s => s.reservation.status === '불필요').length;

    return { cityId: city.id, cityName: city.name, total, pending, completed, unnecessary };
  });

  const totalCost = Object.values(scheduleData)
    .flat()
    .reduce((sum, item) => {
      if (!item.cost) return sum;
      const cost = item.cost.replace(/[^0-9]/g, '');
      return sum + (parseInt(cost) || 0);
    }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map(({ cityId, cityName, total, pending, completed, unnecessary }) => (
        <div key={cityId} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
          <button
            onClick={() => onCityClick?.(cityId)}
            className="w-full text-left group"
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-3 group-hover:text-indigo-600 transition-colors flex items-center justify-between">
              {cityName}
              <span className="text-gray-400 group-hover:text-indigo-500 text-sm">→</span>
            </h3>
          </button>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 일정</span>
              <span className="text-2xl font-bold text-indigo-600">{total}</span>
            </div>
            <button
              onClick={() => onReservationFilterClick?.(cityId, 'required')}
              className="w-full flex justify-between items-center text-sm hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
            >
              <span className="text-gray-600">예약 예정</span>
              <span className="font-semibold text-gray-600">{pending}</span>
            </button>
            <button
              onClick={() => onReservationFilterClick?.(cityId, 'completed')}
              className="w-full flex justify-between items-center text-sm hover:bg-green-50 rounded p-2 -m-2 transition-colors"
            >
              <span className="text-gray-600">예약 완료</span>
              <span className="font-semibold text-green-600">{completed}</span>
            </button>
            <button
              onClick={() => onReservationFilterClick?.(cityId, 'unnecessary')}
              className="w-full flex justify-between items-center text-sm hover:bg-blue-50 rounded p-2 -m-2 transition-colors"
            >
              <span className="text-gray-600">예약 불필요</span>
              <span className="font-semibold text-blue-600">{unnecessary}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

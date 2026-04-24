import { ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';

interface StatsCardProps {
  scheduleData: Record<string, ScheduleItem[]>;
  cities: City[];
}

export default function StatsCard({ scheduleData, cities }: StatsCardProps) {
  const stats = cities.map(city => {
    const schedules = scheduleData[city.id] || [];
    const total = schedules.length;
    const reservationRequired = schedules.filter(s => s.reservation.required).length;
    const completed = schedules.filter(s => s.reservation.completed).length;

    return { cityId: city.id, cityName: city.name, total, reservationRequired, completed };
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
      {stats.map(({ cityId, cityName, total, reservationRequired, completed }) => (
        <div key={cityId} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{cityName}</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">총 일정</span>
              <span className="text-2xl font-bold text-indigo-600">{total}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">예약 필요</span>
              <span className="font-semibold text-orange-600">{reservationRequired}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">예약 완료</span>
              <span className="font-semibold text-green-600">{completed}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { ScheduleByCity } from '../types/schedule';

interface StatsCardProps {
  scheduleData: ScheduleByCity;
}

export default function StatsCard({ scheduleData }: StatsCardProps) {
  const cities = ['부다페스트', '빈', '프라하', '할슈타트'] as const;

  const stats = cities.map(city => {
    const schedules = scheduleData[city] || [];
    const total = schedules.length;
    const reservationRequired = schedules.filter(s => s.reservation.required).length;
    const completed = schedules.filter(s => s.reservation.completed).length;

    return { city, total, reservationRequired, completed };
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
      {stats.map(({ city, total, reservationRequired, completed }) => (
        <div key={city} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{city}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">전체 일정</span>
              <span className="font-bold text-indigo-600">{total}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예약 필요</span>
              <span className="font-bold text-orange-600">{reservationRequired}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예약 완료</span>
              <span className="font-bold text-green-600">{completed}개</span>
            </div>
          </div>
        </div>
      ))}

      {/* Total Cost Card */}
      <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
        <h3 className="text-xl font-semibold mb-2">총 예상 비용</h3>
        <p className="text-3xl font-bold">₩ {totalCost.toLocaleString()}</p>
        <p className="text-sm opacity-90 mt-1">※ 입력된 비용 기준</p>
      </div>
    </div>
  );
}

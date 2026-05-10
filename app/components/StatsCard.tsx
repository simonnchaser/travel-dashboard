'use client';

import { ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';

interface StatsCardProps {
  scheduleData: Record<string, ScheduleItem[]>;
  cities: City[];
  onCityClick?: (cityId: string) => void;
  onReservationFilterClick?: (cityId: string, filter: 'required' | 'completed' | 'unnecessary') => void;
}

// 도시 이름별 텍스트 스타일링
const getCityNameStyle = (cityName: string, index: number) => {
  const styles = [
    // Style 1: 기울어진 입체 효과
    {
      container: 'transform -rotate-2 hover:rotate-0 transition-all duration-300',
      text: 'text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-[2px_2px_0px_rgba(99,102,241,0.3)]',
    },
    // Style 2: 웨이브 효과
    {
      container: 'transform hover:scale-105 transition-all duration-300',
      text: 'text-2xl font-black tracking-wide text-indigo-700 [text-shadow:_2px_0_0_rgb(251_191_36),_-2px_0_0_rgb(251_191_36),_0_2px_0_rgb(251_191_36),_0_-2px_0_rgb(251_191_36),_1px_1px_rgb(251_191_36),_-1px_-1px_0_rgb(251_191_36),_1px_-1px_0_rgb(251_191_36),_-1px_1px_0_rgb(251_191_36)]',
    },
    // Style 3: 레트로 3D 효과
    {
      container: 'transform hover:-translate-y-1 transition-all duration-300',
      text: 'text-2xl font-black uppercase tracking-wider text-emerald-600 [text-shadow:_1px_1px_0px_#8b5cf6,_2px_2px_0px_#8b5cf6,_3px_3px_0px_#8b5cf6,_4px_4px_0px_rgba(139,92,246,0.5)]',
    },
    // Style 4: 네온 글로우 효과
    {
      container: 'transform hover:rotate-1 transition-all duration-300',
      text: 'text-2xl font-black uppercase tracking-wide text-blue-600 [text-shadow:_0_0_10px_rgba(59,130,246,0.8),_0_0_20px_rgba(59,130,246,0.6),_0_0_30px_rgba(59,130,246,0.4)]',
    },
  ];

  return styles[index % 4];
};

export default function StatsCard({ scheduleData, cities, onCityClick, onReservationFilterClick }: StatsCardProps) {
  const stats = cities.map(city => {
    const schedules = scheduleData[city.id] || [];
    const total = schedules.length;
    const pending = schedules.filter(s => s.reservation.status === '예정').length;
    const completed = schedules.filter(s => s.reservation.status === '완료').length;
    const unnecessary = schedules.filter(s => s.reservation.status === '불필요').length;

    return { cityId: city.id, cityName: city.name, total, pending, completed, unnecessary };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      {stats.map(({ cityId, cityName, total, pending, completed, unnecessary }, index) => (
        <div
          key={cityId}
          className="relative group"
          style={{
            filter: 'drop-shadow(6px 6px 0px rgba(99, 102, 241, 0.2))',
          }}
        >
          {/* 퍼즐 조각 SVG */}
          <svg
            className="absolute inset-0 w-full h-full transition-all duration-300 group-hover:-translate-y-2"
            viewBox="0 0 300 400"
            preserveAspectRatio="none"
          >
            {/* 퍼즐 조각 모양 - 각 카드마다 다른 모양 */}
            <path
              d={
                index % 4 === 0
                  ? "M20,20 L130,20 Q140,20 145,30 Q150,40 160,40 Q170,40 175,30 Q180,20 190,20 L280,20 L280,130 Q280,140 270,145 Q260,150 260,160 Q260,170 270,175 Q280,180 280,190 L280,380 L20,380 Z"
                  : index % 4 === 1
                  ? "M20,20 L280,20 L280,130 Q280,140 270,145 Q260,150 260,160 Q260,170 270,175 Q280,180 280,190 L280,380 L190,380 Q180,380 175,370 Q170,360 160,360 Q150,360 145,370 Q140,380 130,380 L20,380 Z"
                  : index % 4 === 2
                  ? "M20,20 L130,20 Q140,20 145,30 Q150,40 160,40 Q170,40 175,30 Q180,20 190,20 L280,20 L280,380 L190,380 Q180,380 175,370 Q170,360 160,360 Q150,360 145,370 Q140,380 130,380 L20,380 L20,190 Q20,180 30,175 Q40,170 40,160 Q40,150 30,145 Q20,140 20,130 Z"
                  : "M20,20 L280,20 L280,190 Q280,180 270,175 Q260,170 260,160 Q260,150 270,145 Q280,140 280,130 L280,380 L20,380 L20,190 Q20,180 30,175 Q40,170 40,160 Q40,150 30,145 Q20,140 20,130 Z"
              }
              fill="white"
              stroke="#a5b4fc"
              strokeWidth="4"
              className="transition-all duration-300"
            />
          </svg>

          {/* 퍼즐 아이콘 장식 */}
          <div className="absolute -top-3 -right-3 text-4xl opacity-80 group-hover:rotate-12 transition-transform duration-300 z-10">
            🧩
          </div>

          {/* 카드 내용 */}
          <div className="relative p-7 transition-all duration-300 group-hover:-translate-y-2">
            <button
              onClick={() => onCityClick?.(cityId)}
              className="w-full text-left group/button mb-6"
            >
              <div className={`${getCityNameStyle(cityName, index).container} flex items-center justify-between gap-3`}>
                <h3 className={getCityNameStyle(cityName, index).text}>
                  {cityName}
                </h3>
                <span className="text-4xl font-black group-hover/button:translate-x-2 group-hover/button:scale-125 transition-all duration-300 text-indigo-600 group-hover/button:text-purple-600 animate-pulse group-hover/button:animate-none">→</span>
              </div>
            </button>
            <div className="space-y-2.5">
              {/* 총 일정 - 퍼즐 조각 스타일 */}
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl transform rotate-1 opacity-20"></div>
                <div className="relative flex justify-between items-center px-4 py-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 transform -rotate-1 hover:rotate-0 transition-transform duration-200">
                  <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">총 일정</span>
                  <span className="text-3xl font-black text-indigo-600">{total}</span>
                </div>
              </div>
              {/* 예약 예정 */}
              <button
                onClick={() => onReservationFilterClick?.(cityId, 'required')}
                className="group/stat w-full flex justify-between items-center px-3.5 py-2.5 bg-white rounded-lg border-2 border-gray-200 transition-all duration-200 hover:border-gray-400 hover:shadow-[2px_2px_0px_0px_rgba(107,114,128,0.3)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">예약 예정</span>
                <span className="text-xl font-black text-gray-800 group-hover/stat:scale-105 transition-transform">{pending}</span>
              </button>

              {/* 예약 완료 */}
              <button
                onClick={() => onReservationFilterClick?.(cityId, 'completed')}
                className="group/stat w-full flex justify-between items-center px-3.5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 transition-all duration-200 hover:border-green-400 hover:shadow-[2px_2px_0px_0px_rgba(34,197,94,0.3)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">예약 완료</span>
                <span className="text-xl font-black text-green-600 group-hover/stat:scale-105 transition-transform">{completed}</span>
              </button>

              {/* 예약 불필요 */}
              <button
                onClick={() => onReservationFilterClick?.(cityId, 'unnecessary')}
                className="group/stat w-full flex justify-between items-center px-3.5 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 transition-all duration-200 hover:border-blue-400 hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">예약 불필요</span>
                <span className="text-xl font-black text-blue-600 group-hover/stat:scale-105 transition-transform">{unnecessary}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

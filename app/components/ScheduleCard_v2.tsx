'use client';

import { ScheduleItem, ScheduleCategory } from '../types/schedule';
import { supabase } from '../../lib/supabase';
import CostDisplay from './CostDisplay';
import {
  getPuzzleCardStyle,
  getPuzzleBadgeStyle
} from '../styles/puzzleStyles';

interface ScheduleCardProps {
  schedule: ScheduleItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (schedule: ScheduleItem) => void;
  onDelete: () => void;
  onEdit: () => void; // New prop to trigger modal opening
}

const categoryLabels: Record<ScheduleCategory, string> = {
  accommodation: '🏨 숙소',
  dining: '🍽️ 식사',
  activity: '🎭 관광/액티비티',
  transport: '🚌 이동/교통',
  tour: '🎯 투어',
};


// Helper function to parse tour data from details field
const parseTourData = (schedule: ScheduleItem) => {
  if (schedule.category !== 'tour' || !schedule.details) {
    return { tour_guide: '', tour_spots: [], userDetails: '' };
  }

  try {
    const parsed = JSON.parse(schedule.details);
    return {
      tour_guide: parsed.tour_guide || '',
      tour_spots: parsed.tour_spots || [],
      userDetails: parsed.userDetails || '',
    };
  } catch {
    // If details is not JSON, treat it as plain text
    return { tour_guide: '', tour_spots: [], userDetails: schedule.details };
  }
};

export default function ScheduleCard({
  schedule,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onEdit,
}: ScheduleCardProps) {
  // Parse tour data from schedule
  const tourData = parseTourData(schedule);

  const cycleReservationStatus = async () => {
    // Cycle: 예정 → 완료 → 불필요 → 예정
    const currentStatus = schedule.reservation.status || '예정';
    let nextStatus: '예정' | '완료' | '불필요';

    if (currentStatus === '예정') {
      nextStatus = '완료';
    } else if (currentStatus === '완료') {
      nextStatus = '불필요';
    } else {
      nextStatus = '예정';
    }

    const updatedSchedule: ScheduleItem = {
      ...schedule,
      reservation: {
        ...schedule.reservation,
        completed: nextStatus === '완료',
        status: nextStatus as '예정' | '완료' | '불필요',
      },
    };

    if (schedule.id) {
      const { error } = await supabase
        .from('schedules')
        .update({
          reservation_completed: nextStatus === '완료',
          reservation_status: nextStatus,
        })
        .eq('id', schedule.id);

      if (!error) {
        onUpdate(updatedSchedule);
      }
    }
  };


  return (
    <div className={`${getPuzzleCardStyle(schedule.category)} overflow-hidden`}>
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between gap-4">
          {/* Left: Number and Title */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)]">
              {index + 1}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{schedule.title}</h3>
              <p className="text-sm text-gray-500">
                {schedule.date} {schedule.time && `- ${schedule.time}`}
              </p>
              <span className={`inline-block mt-2 ${getPuzzleBadgeStyle(schedule.category)}`}>
                {categoryLabels[schedule.category]}
              </span>
            </div>
          </div>

          {/* Right: Cost, Google Maps, Reservation Status */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Cost Display */}
            {schedule.cost && (
              <div className="flex items-center gap-1">
                <span>💰</span>
                <CostDisplay amount={schedule.cost} currency={schedule.currency} numPeople={schedule.num_people} />
              </div>
            )}

            {/* Google Maps Link */}
            {schedule.google_maps_url && (
              <a
                href={schedule.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline text-sm font-medium"
              >
                <span>📍</span>
                <span>구글맵</span>
              </a>
            )}

            {/* Reservation Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">예약:</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cycleReservationStatus();
                }}
                className={`
                  px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                  ${schedule.reservation.status === '완료'
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[3px_3px_0px_0px_rgba(16,185,129,0.3)] hover:shadow-[5px_5px_0px_0px_rgba(16,185,129,0.4)] hover:-translate-y-0.5'
                    : schedule.reservation.status === '불필요'
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)] hover:shadow-[5px_5px_0px_0px_rgba(59,130,246,0.4)] hover:-translate-y-0.5'
                    : 'bg-white text-gray-700 border-2 border-gray-300 shadow-[3px_3px_0px_0px_rgba(156,163,175,0.2)] hover:shadow-[5px_5px_0px_0px_rgba(156,163,175,0.3)] hover:-translate-y-0.5'
                  }
                `}
                title="클릭하여 상태 변경: 예정 → 완료 → 불필요 → 예정"
              >
                {schedule.reservation.status || '예정'}
              </button>
            </div>

            {/* Expand/Collapse Button */}
            <button className={`
              text-2xl transition-all duration-200
              ${isExpanded ? 'rotate-180 text-indigo-600' : 'rotate-0 text-gray-400'}
              hover:text-indigo-500 hover:scale-110
            `}>
              ▼
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Top Row: Number, Title, Expand Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-[2px_2px_0px_0px_rgba(99,102,241,0.3)]">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{schedule.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {schedule.date} {schedule.time && `- ${schedule.time}`}
                </p>
                <span className={`inline-block mt-1.5 ${getPuzzleBadgeStyle(schedule.category)}`}>
                  {categoryLabels[schedule.category]}
                </span>
              </div>
            </div>
            <button className={`
              text-xl transition-all duration-200 shrink-0
              ${isExpanded ? 'rotate-180 text-indigo-600' : 'rotate-0 text-gray-400'}
              hover:text-indigo-500 hover:scale-110
            `}>
              ▼
            </button>
          </div>

          {/* Bottom Row: Cost, Google Maps, Reservation */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Cost */}
            {schedule.cost && (
              <div className="flex items-center gap-1 text-sm">
                <span>💰</span>
                <CostDisplay amount={schedule.cost} currency={schedule.currency} numPeople={schedule.num_people} />
              </div>
            )}

            {/* Google Maps Icon Only */}
            {schedule.google_maps_url && (
              <a
                href={schedule.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-2xl hover:scale-110 transition-transform"
                title="구글맵에서 보기"
              >
                📍
              </a>
            )}

            {/* Reservation Status - Compact */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleReservationStatus();
              }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                ${schedule.reservation.status === '완료'
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(16,185,129,0.3)]'
                  : schedule.reservation.status === '불필요'
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-[2px_2px_0px_0px_rgba(59,130,246,0.3)]'
                  : 'bg-white text-gray-700 border-2 border-gray-300 shadow-[2px_2px_0px_0px_rgba(156,163,175,0.2)]'
                }
              `}
              title="예약 상태"
            >
              {schedule.reservation.status || '예정'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t-4 border-indigo-100 p-4 md:p-6 bg-gradient-to-b from-gray-50 to-white space-y-4">
          {/* Details Section */}
          {schedule.details && (
            <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.1)]">
              <p className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📋</span>
                상세 정보
              </p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{schedule.details}</p>
            </div>
          )}

          {/* Common Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            {schedule.cost && (
              <div className="flex items-start gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">비용</p>
                  <CostDisplay amount={schedule.cost} currency={schedule.currency} numPeople={schedule.num_people} />
                </div>
              </div>
            )}
          </div>

          {/* Category-Specific Fields */}
          {schedule.category === 'accommodation' && (
            <div className="bg-purple-50 border-2 border-purple-200 p-5 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.1)]">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🏨</span>
                숙소 정보
              </h4>
              {schedule.address && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">주소</p>
                  <p className="text-gray-600">{schedule.address}</p>
                </div>
              )}
              {schedule.checkin_checkout && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">체크인/아웃</p>
                  <p className="text-gray-600">{schedule.checkin_checkout}</p>
                </div>
              )}
              {schedule.duration && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">기간</p>
                  <p className="text-gray-600">{schedule.duration}</p>
                </div>
              )}
            </div>
          )}

          {schedule.category === 'dining' && (
            <div className="bg-green-50 border-2 border-green-200 p-5 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(34,197,94,0.1)]">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🍽️</span>
                식사 정보
              </h4>
              {schedule.restaurant_name && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">레스토랑명</p>
                  <p className="text-gray-600">{schedule.restaurant_name}</p>
                </div>
              )}
              {schedule.menu && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">메뉴</p>
                  <p className="text-gray-600">{schedule.menu}</p>
                </div>
              )}
              {schedule.reservation_time && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">예약 시간</p>
                  <p className="text-gray-600">{schedule.reservation_time}</p>
                </div>
              )}
              {schedule.address && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">주소</p>
                  <p className="text-gray-600">{schedule.address}</p>
                </div>
              )}
            </div>
          )}

          {schedule.category === 'activity' && (
            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.1)]">
              <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🎭</span>
                액티비티 정보
              </h4>
              {schedule.activity_duration && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">소요 시간</p>
                  <p className="text-gray-600">{schedule.activity_duration}</p>
                </div>
              )}
              {schedule.entrance_fee && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">입장료</p>
                  <p className="text-gray-600">{schedule.entrance_fee}</p>
                </div>
              )}
              {schedule.operating_hours && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">운영 시간</p>
                  <p className="text-gray-600">{schedule.operating_hours}</p>
                </div>
              )}
            </div>
          )}

          {schedule.category === 'transport' && (
            <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.1)]">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🚌</span>
                교통 정보
              </h4>
              {schedule.departure && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">출발지</p>
                  <p className="text-gray-600">{schedule.departure}</p>
                </div>
              )}
              {schedule.arrival && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">도착지</p>
                  <p className="text-gray-600">{schedule.arrival}</p>
                </div>
              )}
              {schedule.transport_method && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">교통수단</p>
                  <p className="text-gray-600">{schedule.transport_method}</p>
                </div>
              )}
              {schedule.travel_duration && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">소요 시간</p>
                  <p className="text-gray-600">{schedule.travel_duration}</p>
                </div>
              )}
            </div>
          )}

          {schedule.category === 'tour' && (
            <div className="bg-orange-50 border-2 border-orange-200 p-5 rounded-2xl space-y-3 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.1)]">
              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-lg">
                <span className="text-2xl">🎯</span>
                투어 정보
              </h4>
              {schedule.meeting_location && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">집합 장소</p>
                  <p className="text-gray-600">{schedule.meeting_location}</p>
                </div>
              )}
              {schedule.meeting_time && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">집합 시간</p>
                  <p className="text-gray-600">{schedule.meeting_time}</p>
                </div>
              )}
              {tourData.tour_guide && (
                <div>
                  <p className="text-sm font-semibold text-gray-700">가이드</p>
                  <p className="text-gray-600">{tourData.tour_guide}</p>
                </div>
              )}
              {tourData.tour_spots && tourData.tour_spots.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">투어 스팟</p>
                  <div className="space-y-2">
                    {tourData.tour_spots.sort((a: any, b: any) => a.order - b.order).map((spot: any, idx: number) => (
                      <div key={spot.id} className="bg-white p-4 rounded-xl border-2 border-orange-100 shadow-[2px_2px_0px_0px_rgba(249,115,22,0.15)] hover:shadow-[3px_3px_0px_0px_rgba(249,115,22,0.2)] transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg">#{idx + 1}</span>
                            <span className="font-semibold text-gray-800">{spot.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 font-medium">⏱️ {spot.duration}</span>
                        </div>
                        {spot.details && (
                          <p className="text-sm text-gray-600 pl-1">{spot.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Google Maps Link */}
          {schedule.google_maps_url && (
            <a
              href={schedule.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border-2 border-indigo-200 rounded-xl shadow-[3px_3px_0px_0px_rgba(99,102,241,0.15)] hover:shadow-[5px_5px_0px_0px_rgba(99,102,241,0.2)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-2xl">📍</span>
              <span className="text-indigo-600 font-semibold group-hover:text-indigo-800">
                구글맵에서 보기
              </span>
            </a>
          )}

          {/* Reservation Link */}
          {schedule.reservation_link && (
            <a
              href={schedule.reservation_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border-2 border-purple-200 rounded-xl shadow-[3px_3px_0px_0px_rgba(168,85,247,0.15)] hover:shadow-[5px_5px_0px_0px_rgba(168,85,247,0.2)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <span className="text-2xl">🔗</span>
              <span className="text-purple-600 font-semibold group-hover:text-purple-800">
                예약 링크
              </span>
            </a>
          )}

          {/* Notes */}
          {schedule.notes && (
            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl shadow-[3px_3px_0px_0px_rgba(251,191,36,0.1)]">
              <p className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span className="text-lg">📝</span>
                메모
              </p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{schedule.notes}</p>
            </div>
          )}

          {/* Action Buttons - Detail View */}
          <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-6 py-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(99,102,241,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:shadow-[3px_3px_0px_0px_rgba(99,102,241,0.3)] active:translate-y-0 transition-all duration-200"
            >
              ✏️ 수정하기
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('정말 이 일정을 삭제하시겠습니까?')) {
                  onDelete();
                }
              }}
              className="px-6 py-3 bg-white text-red-600 border-2 border-red-300 rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(239,68,68,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 active:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)] active:translate-y-0 transition-all duration-200"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

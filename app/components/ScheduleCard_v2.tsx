'use client';

import { ScheduleItem, ScheduleCategory } from '../types/schedule';
import { supabase } from '../../lib/supabase';
import CostDisplay from './CostDisplay';

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
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Card Header - Always Visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpand}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex items-start justify-between gap-4">
          {/* Left: Number and Title */}
          <div className="flex items-start gap-3">
            <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{schedule.title}</h3>
              <p className="text-sm text-gray-500">
                {schedule.date} {schedule.time && `- ${schedule.time}`}
              </p>
              <p className="text-xs text-gray-400 mt-1">{categoryLabels[schedule.category]}</p>
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
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md ${
                  schedule.reservation.status === '완료'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : schedule.reservation.status === '불필요'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="클릭하여 상태 변경: 예정 → 완료 → 불필요 → 예정"
              >
                {schedule.reservation.status || '예정'}
              </button>
            </div>

            {/* Expand/Collapse Button */}
            <button className="text-gray-400 hover:text-gray-600">
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Top Row: Number, Title, Expand Button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="text-xl font-bold text-indigo-600">#{index + 1}</span>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{schedule.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {schedule.date} {schedule.time && `- ${schedule.time}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">{categoryLabels[schedule.category]}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 text-xl shrink-0">
              {isExpanded ? '▲' : '▼'}
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                schedule.reservation.status === '완료'
                  ? 'bg-green-100 text-green-700'
                  : schedule.reservation.status === '불필요'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
              title="예약 상태"
            >
              {schedule.reservation.status || '예정'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50 space-y-4">
          {/* Details Section */}
          {schedule.details && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">📋 상세 정보</p>
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
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-blue-900 mb-3">🏨 숙소 정보</h4>
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
            <div className="bg-orange-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-orange-900 mb-3">🍽️ 식사 정보</h4>
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
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-purple-900 mb-3">🎭 액티비티 정보</h4>
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
            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-green-900 mb-3">🚌 교통 정보</h4>
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
            <div className="bg-yellow-50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-yellow-900 mb-3">🎯 투어 정보</h4>
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
                      <div key={spot.id} className="bg-white p-3 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-yellow-700">#{idx + 1}</span>
                            <span className="font-medium text-gray-800">{spot.name}</span>
                          </div>
                          <span className="text-sm text-gray-600">⏱️ {spot.duration}</span>
                        </div>
                        {spot.details && (
                          <p className="text-sm text-gray-600 pl-7">{spot.details}</p>
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
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <a
                href={schedule.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                구글맵에서 보기
              </a>
            </div>
          )}

          {/* Reservation Link */}
          {schedule.reservation_link && (
            <div className="flex items-center gap-2">
              <span className="text-xl">🔗</span>
              <a
                href={schedule.reservation_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                예약 링크
              </a>
            </div>
          )}

          {/* Notes */}
          {schedule.notes && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">📝 메모</p>
              <p className="text-gray-600 whitespace-pre-wrap">{schedule.notes}</p>
            </div>
          )}

          {/* Action Buttons - Detail View */}
          <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg"
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
              className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-semibold"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

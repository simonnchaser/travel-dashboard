'use client';

import { useState } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types/schedule';
import { supabase } from '../../lib/supabase';
import { Currency } from '../../lib/currency';
import CostInput from './CostInput';
import CostDisplay from './CostDisplay';
import PlaceAutocomplete from './PlaceAutocomplete';

interface ScheduleCardProps {
  schedule: ScheduleItem;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (schedule: ScheduleItem) => void;
  onDelete: () => void;
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
}: ScheduleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<ScheduleItem>(schedule);
  const [saving, setSaving] = useState(false);

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

  const saveChanges = async () => {
    setSaving(true);

    try {
      if (schedule.id) {
        // For tour category, encode tour data in details field
        let detailsToSave = editedSchedule.details;
        if (editedSchedule.category === 'tour') {
          const tourData = {
            userDetails: editedSchedule.details,
            tour_guide: editedSchedule.tour_guide,
            tour_spots: editedSchedule.tour_spots || [],
          };
          detailsToSave = JSON.stringify(tourData);
        }

        const updateData: any = {
          category: editedSchedule.category,
          date: editedSchedule.date,
          time: editedSchedule.time,
          title: editedSchedule.title,
          details: detailsToSave,
          cost: editedSchedule.cost,
          currency: editedSchedule.currency || 'KRW',
          num_people: editedSchedule.num_people || 1,
          google_maps_url: editedSchedule.google_maps_url,
          reservation_status: editedSchedule.reservation.status,
          reservation_completed: editedSchedule.reservation.status === '완료',
          notes: editedSchedule.notes,
        };

        // Add category-specific fields
        if (editedSchedule.category === 'accommodation') {
          updateData.address = editedSchedule.address;
          updateData.checkin_checkout = editedSchedule.checkin_checkout;
          updateData.duration = editedSchedule.duration;
        } else if (editedSchedule.category === 'dining') {
          updateData.restaurant_name = editedSchedule.restaurant_name;
          updateData.menu = editedSchedule.menu;
          updateData.reservation_time = editedSchedule.reservation_time;
          updateData.address = editedSchedule.address;
        } else if (editedSchedule.category === 'activity') {
          updateData.activity_duration = editedSchedule.activity_duration;
          updateData.entrance_fee = editedSchedule.entrance_fee;
          updateData.operating_hours = editedSchedule.operating_hours;
        } else if (editedSchedule.category === 'transport') {
          updateData.departure = editedSchedule.departure;
          updateData.arrival = editedSchedule.arrival;
          updateData.transport_method = editedSchedule.transport_method;
          updateData.travel_duration = editedSchedule.travel_duration;
          updateData.departure_google_maps_url = editedSchedule.departure_google_maps_url;
          updateData.arrival_google_maps_url = editedSchedule.arrival_google_maps_url;
          updateData.departure_time = editedSchedule.departure_time;
          updateData.arrival_time = editedSchedule.arrival_time;
        }
        // Note: tour category data is saved in details field as JSON

        const { error } = await supabase
          .from('schedules')
          .update(updateData)
          .eq('id', schedule.id);

        if (error) throw error;

        onUpdate(editedSchedule);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('일정 업데이트 실패! 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditedSchedule(schedule);
    setIsEditing(false);
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
          {!isEditing ? (
            <>
              {/* Detail View Mode */}
              <div className="space-y-4">
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
              </div>

              {/* Action Buttons - Detail View */}
              <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <button
                  onClick={() => {
                    // Initialize editedSchedule with tour data if it's a tour category
                    if (schedule.category === 'tour') {
                      setEditedSchedule({
                        ...schedule,
                        tour_guide: tourData.tour_guide,
                        tour_spots: tourData.tour_spots,
                        details: tourData.userDetails,
                      });
                    }
                    setIsEditing(true);
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
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(categoryLabels) as ScheduleCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditedSchedule({ ...editedSchedule, category: cat })}
                        className={`p-3 rounded-lg font-semibold transition-all ${
                          editedSchedule.category === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {categoryLabels[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">날짜</label>
                    <input
                      type="date"
                      value={editedSchedule.date}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, date: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">시간</label>
                    <input
                      type="time"
                      value={editedSchedule.time || ''}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, time: e.target.value })}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Cost with Currency and Number of People */}
                <CostInput
                  amount={editedSchedule.cost || ''}
                  currency={(editedSchedule.currency as Currency) || 'KRW'}
                  numPeople={editedSchedule.num_people || 1}
                  onAmountChange={(amount) => setEditedSchedule({ ...editedSchedule, cost: amount })}
                  onCurrencyChange={(currency) => setEditedSchedule({ ...editedSchedule, currency })}
                  onNumPeopleChange={(numPeople) => setEditedSchedule({ ...editedSchedule, num_people: numPeople })}
                  placeholder="50,000"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={editedSchedule.title}
                    onChange={(e) => setEditedSchedule({ ...editedSchedule, title: e.target.value })}
                    placeholder="일정 제목"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">상세 내용</label>
                  <textarea
                    value={editedSchedule.details}
                    onChange={(e) => setEditedSchedule({ ...editedSchedule, details: e.target.value })}
                    placeholder="상세 일정"
                    rows={3}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Google Maps - Hide for transport category */}
                {editedSchedule.category !== 'transport' && (
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {editedSchedule.category === 'tour' ? '집합 장소' : '장소 검색'}
                        <span className="text-xs text-gray-500 ml-2">(자동완성)</span>
                      </label>
                      <PlaceAutocomplete
                        value={editedSchedule.address || ''}
                        onChange={(value) => setEditedSchedule({ ...editedSchedule, address: value })}
                        onPlaceSelect={(place) => {
                          setEditedSchedule({
                            ...editedSchedule,
                            address: place.address,
                            google_maps_url: place.google_maps_url,
                            title: editedSchedule.title || place.name,
                          });
                        }}
                        placeholder={
                          editedSchedule.category === 'accommodation' ? '호텔명 또는 주소 (예: 부다페스트 힐튼 호텔)' :
                          editedSchedule.category === 'dining' ? '식당명 또는 주소 (예: 중앙시장)' :
                          editedSchedule.category === 'tour' ? '집합 장소 (예: 호텔 로비, 중앙역 앞)' :
                          '장소명 또는 주소를 입력하세요'
                        }
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 장소를 입력하면 자동으로 후보가 나타납니다. 선택하면 구글맵 좌표가 자동 저장됩니다.
                      </p>
                    </div>

                    {/* 선택된 구글맵 URL 표시 */}
                    {editedSchedule.google_maps_url && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-green-700 font-medium">장소가 선택되었습니다</span>
                        <a
                          href={editedSchedule.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 underline"
                        >
                          구글맵에서 보기 →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Reservation Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">예약 상태</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditedSchedule({
                        ...editedSchedule,
                        reservation: { ...editedSchedule.reservation, status: '예정' as '예정' | '완료' | '불필요' }
                      })}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        editedSchedule.reservation.status === '예정'
                          ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
                      }`}
                    >
                      예정
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedSchedule({
                        ...editedSchedule,
                        reservation: { ...editedSchedule.reservation, status: '완료' as '예정' | '완료' | '불필요' }
                      })}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        editedSchedule.reservation.status === '완료'
                          ? 'bg-green-200 text-green-800 ring-2 ring-green-400'
                          : 'bg-green-100 text-green-700 hover:bg-green-150'
                      }`}
                    >
                      완료
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditedSchedule({
                        ...editedSchedule,
                        reservation: { ...editedSchedule.reservation, status: '불필요' as '예정' | '완료' | '불필요' }
                      })}
                      className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                        editedSchedule.reservation.status === '불필요'
                          ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-400'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-150'
                      }`}
                    >
                      불필요
                    </button>
                  </div>
                </div>

                {/* Category-Specific Fields */}
                {editedSchedule.category === 'accommodation' && (
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-blue-900">숙소 정보</h3>
                    <input
                      type="text"
                      value={editedSchedule.address || ''}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, address: e.target.value })}
                      placeholder="주소"
                      className="w-full p-2 border rounded-md"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editedSchedule.checkin_checkout || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, checkin_checkout: e.target.value })}
                        placeholder="체크인/아웃 (15:00 / 10:00)"
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        value={editedSchedule.duration || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, duration: e.target.value })}
                        placeholder="기간 (3박)"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}

                {editedSchedule.category === 'dining' && (
                  <div className="bg-orange-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-orange-900">식사 정보</h3>
                    <input
                      type="text"
                      value={editedSchedule.restaurant_name || ''}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, restaurant_name: e.target.value })}
                      placeholder="레스토랑명"
                      className="w-full p-2 border rounded-md"
                    />
                    <input
                      type="text"
                      value={editedSchedule.menu || ''}
                      onChange={(e) => setEditedSchedule({ ...editedSchedule, menu: e.target.value })}
                      placeholder="메뉴"
                      className="w-full p-2 border rounded-md"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editedSchedule.reservation_time || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, reservation_time: e.target.value })}
                        placeholder="예약 시간"
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        value={editedSchedule.address || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, address: e.target.value })}
                        placeholder="주소"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}

                {editedSchedule.category === 'activity' && (
                  <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-purple-900">액티비티 정보</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editedSchedule.activity_duration || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, activity_duration: e.target.value })}
                        placeholder="소요 시간"
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        value={editedSchedule.entrance_fee || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, entrance_fee: e.target.value })}
                        placeholder="입장료"
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        value={editedSchedule.operating_hours || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, operating_hours: e.target.value })}
                        placeholder="운영 시간"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}

                {editedSchedule.category === 'transport' && (
                  <div className="bg-orange-50 p-4 rounded-lg space-y-3 border-2 border-orange-200">
                    <h3 className="font-semibold text-orange-900">🚌 교통 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-2">출발지</label>
                        <PlaceAutocomplete
                          value={editedSchedule.departure || ''}
                          onChange={(value) => setEditedSchedule({ ...editedSchedule, departure: value })}
                          onPlaceSelect={(place) => {
                            setEditedSchedule({
                              ...editedSchedule,
                              departure: place.name,
                              departure_google_maps_url: place.google_maps_url,
                            });
                          }}
                          placeholder="출발지 입력 (예: 부다페스트 공항)"
                          className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        />
                        {editedSchedule.departure_google_maps_url && (
                          <a
                            href={editedSchedule.departure_google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:text-orange-800 underline mt-1 inline-block"
                          >
                            ✓ 출발지 확인
                          </a>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-2">도착지</label>
                        <PlaceAutocomplete
                          value={editedSchedule.arrival || ''}
                          onChange={(value) => setEditedSchedule({ ...editedSchedule, arrival: value })}
                          onPlaceSelect={(place) => {
                            setEditedSchedule({
                              ...editedSchedule,
                              arrival: place.name,
                              arrival_google_maps_url: place.google_maps_url,
                            });
                          }}
                          placeholder="도착지 입력 (예: 부다페스트 숙소)"
                          className="w-full p-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                        />
                        {editedSchedule.arrival_google_maps_url && (
                          <a
                            href={editedSchedule.arrival_google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:text-orange-800 underline mt-1 inline-block"
                          >
                            ✓ 도착지 확인
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-1">출발 시간</label>
                        <input
                          type="time"
                          value={editedSchedule.departure_time || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, departure_time: e.target.value })}
                          className="w-full p-2 border-2 border-orange-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-1">도착 시간</label>
                        <input
                          type="time"
                          value={editedSchedule.arrival_time || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, arrival_time: e.target.value })}
                          className="w-full p-2 border-2 border-orange-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-1">교통수단</label>
                        <input
                          type="text"
                          value={editedSchedule.transport_method || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, transport_method: e.target.value })}
                          placeholder="택시, 기차, 버스 등"
                          className="w-full p-2 border-2 border-orange-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-orange-800 mb-1">소요 시간 (선택사항)</label>
                        <input
                          type="text"
                          value={editedSchedule.travel_duration || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, travel_duration: e.target.value })}
                          placeholder="3시간"
                          className="w-full p-2 border-2 border-orange-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editedSchedule.category === 'tour' && (
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-3 border-2 border-yellow-200">
                    <h3 className="font-semibold text-yellow-900">🎯 투어 정보</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-yellow-800 mb-1">집합 장소</label>
                        <input
                          type="text"
                          value={editedSchedule.meeting_location || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, meeting_location: e.target.value })}
                          placeholder="예: 프라하 구시가 광장"
                          className="w-full p-2 border-2 border-yellow-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-yellow-800 mb-1">집합 시간</label>
                        <input
                          type="time"
                          value={editedSchedule.meeting_time || ''}
                          onChange={(e) => setEditedSchedule({ ...editedSchedule, meeting_time: e.target.value })}
                          className="w-full p-2 border-2 border-yellow-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-yellow-800 mb-1">가이드 정보</label>
                      <input
                        type="text"
                        value={editedSchedule.tour_guide || ''}
                        onChange={(e) => setEditedSchedule({ ...editedSchedule, tour_guide: e.target.value })}
                        placeholder="예: 김철수 가이드 (010-1234-5678)"
                        className="w-full p-2 border-2 border-yellow-300 rounded-md"
                      />
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-yellow-800">투어 스팟</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newSpot = {
                              id: `spot-${Date.now()}`,
                              name: '',
                              duration: '',
                              details: '',
                              order: (editedSchedule.tour_spots?.length || 0) + 1,
                            };
                            setEditedSchedule({
                              ...editedSchedule,
                              tour_spots: [...(editedSchedule.tour_spots || []), newSpot],
                            });
                          }}
                          className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm font-semibold hover:bg-yellow-700 transition-all"
                        >
                          + 스팟 추가
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editedSchedule.tour_spots || []).map((spot, idx) => (
                          <div key={spot.id} className="flex gap-2 items-start bg-white p-3 rounded-md border border-yellow-200">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={spot.name}
                                onChange={(e) => {
                                  const updatedSpots = [...(editedSchedule.tour_spots || [])];
                                  updatedSpots[idx] = { ...spot, name: e.target.value };
                                  setEditedSchedule({ ...editedSchedule, tour_spots: updatedSpots });
                                }}
                                placeholder="스팟 이름 (예: 프라하 성)"
                                className="w-full p-2 border border-yellow-300 rounded-md text-sm"
                              />
                              <input
                                type="text"
                                value={spot.duration}
                                onChange={(e) => {
                                  const updatedSpots = [...(editedSchedule.tour_spots || [])];
                                  updatedSpots[idx] = { ...spot, duration: e.target.value };
                                  setEditedSchedule({ ...editedSchedule, tour_spots: updatedSpots });
                                }}
                                placeholder="소요 시간 (예: 1시간 30분)"
                                className="w-full p-2 border border-yellow-300 rounded-md text-sm"
                              />
                              <textarea
                                value={spot.details || ''}
                                onChange={(e) => {
                                  const updatedSpots = [...(editedSchedule.tour_spots || [])];
                                  updatedSpots[idx] = { ...spot, details: e.target.value };
                                  setEditedSchedule({ ...editedSchedule, tour_spots: updatedSpots });
                                }}
                                placeholder="상세 정보 (예: 입장료, 특이사항 등)"
                                rows={2}
                                className="w-full p-2 border border-yellow-300 rounded-md text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedSpots = (editedSchedule.tour_spots || []).filter((_, i) => i !== idx);
                                setEditedSchedule({ ...editedSchedule, tour_spots: updatedSpots });
                              }}
                              className="px-2 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-all mt-1"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                        {(!editedSchedule.tour_spots || editedSchedule.tour_spots.length === 0) && (
                          <p className="text-sm text-yellow-700 text-center py-2">+ 스팟 추가 버튼을 눌러 투어 스팟을 추가하세요</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">메모</label>
                  <textarea
                    value={editedSchedule.notes || ''}
                    onChange={(e) => setEditedSchedule({ ...editedSchedule, notes: e.target.value })}
                    rows={3}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="border-t pt-4 flex gap-2">
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

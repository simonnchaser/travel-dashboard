'use client';

import { useState } from 'react';
import { ScheduleCategory } from '../types/schedule';
import { City } from '../types/tripSettings';
import { supabase } from '../../lib/supabase';
import { Currency } from '../../lib/currency';
import CostInput from './CostInput';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  onScheduleAdded: () => void;
  projectId: string;
}

const categoryLabels: Record<ScheduleCategory, string> = {
  accommodation: '🏨 숙소',
  dining: '🍽️ 식사',
  activity: '🎭 관광/액티비티',
  transport: '🚌 이동/교통',
  tour: '🎯 투어',
};

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

export default function AddScheduleModal({ isOpen, onClose, cities, onScheduleAdded, projectId }: AddScheduleModalProps) {
  const [category, setCategory] = useState<ScheduleCategory>('activity');
  const [selectedCityId, setSelectedCityId] = useState<string>(cities[0]?.id || '');
  const [formData, setFormData] = useState<any>({
    date: '',
    day_of_week: '',
    time: '09:00',
    title: '',
    details: '',
    cost: '',
    currency: 'KRW' as Currency,
    google_maps_url: '',
    reservation_status: '예정',
    tour_spots: [],
  });
  const [saving, setSaving] = useState(false);

  // 투어 스팟 추가
  const addTourSpot = () => {
    const newSpot = {
      id: `spot-${Date.now()}`,
      name: '',
      duration: '',
      details: '',
      order: (formData.tour_spots?.length || 0) + 1,
    };
    setFormData({
      ...formData,
      tour_spots: [...(formData.tour_spots || []), newSpot],
    });
  };

  // 투어 스팟 제거
  const removeTourSpot = (spotId: string) => {
    setFormData({
      ...formData,
      tour_spots: formData.tour_spots?.filter((spot: any) => spot.id !== spotId) || [],
    });
  };

  // 투어 스팟 수정
  const updateTourSpot = (spotId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      tour_spots: formData.tour_spots?.map((spot: any) =>
        spot.id === spotId ? { ...spot, [field]: value } : spot
      ) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.day_of_week || !formData.title) {
      alert('필수 항목을 모두 입력해주세요!');
      return;
    }

    setSaving(true);

    try {
      const selectedCity = cities.find(c => c.id === selectedCityId);
      const baseData = {
        city: selectedCity?.name,
        city_id: selectedCityId,
        category: category,
        date: formData.date,
        day_of_week: formData.day_of_week,
        time: formData.time,
        title: formData.title,
        details: formData.details,
        cost: formData.cost,
        currency: formData.currency,
        google_maps_url: formData.google_maps_url,
        reservation_completed: formData.reservation_status === '완료',
        reservation_status: formData.reservation_status,
      };

      let categoryData = {};
      if (category === 'accommodation') {
        categoryData = {
          address: formData.address,
          checkin_checkout: formData.checkin_checkout,
          duration: formData.duration,
        };
      } else if (category === 'dining') {
        categoryData = {
          restaurant_name: formData.restaurant_name,
          menu: formData.menu,
          reservation_time: formData.reservation_time,
          address: formData.address,
        };
      } else if (category === 'activity') {
        categoryData = {
          activity_duration: formData.activity_duration,
          entrance_fee: formData.entrance_fee,
          operating_hours: formData.operating_hours,
        };
      } else if (category === 'transport') {
        categoryData = {
          departure: formData.departure,
          arrival: formData.arrival,
          transport_method: formData.transport_method,
          travel_duration: formData.travel_duration,
          departure_google_maps_url: formData.departure_google_maps_url,
          arrival_google_maps_url: formData.arrival_google_maps_url,
          departure_time: formData.departure_time,
          arrival_time: formData.arrival_time,
        };
      } else if (category === 'tour') {
        categoryData = {
          meeting_location: formData.meeting_location,
          meeting_time: formData.meeting_time,
          tour_guide: formData.tour_guide,
          tour_spots: formData.tour_spots || [],
        };
      }

      const { error } = await supabase.from('schedules').insert({
        ...baseData,
        ...categoryData,
        project_id: projectId,
      });

      if (error) throw error;

      // Reset form
      setFormData({
        date: '',
        day_of_week: '',
        time: '09:00',
        title: '',
        details: '',
        cost: '',
        google_maps_url: '',
        reservation_required: false,
      });
      setCategory('activity');
      setSelectedCityId(cities[0]?.id || '');

      onScheduleAdded();
      onClose();
    } catch (error) {
      console.error('Failed to add schedule:', error);
      alert('일정 추가 실패! 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-indigo-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800">✨ 새 일정 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-light leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">카테고리 *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(categoryLabels) as ScheduleCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">도시 *</label>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">날짜 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">요일 *</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">선택하세요</option>
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>{day}요일</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">시간</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="일정 제목"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">상세 내용</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="상세 일정"
              rows={3}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Cost with Currency Selector */}
          <CostInput
            amount={formData.cost}
            currency={formData.currency}
            onAmountChange={(amount) => setFormData({ ...formData, cost: amount })}
            onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
            placeholder="50,000"
          />

          {/* Google Maps - Hide for transport category */}
          {category !== 'transport' && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  장소 검색
                  <span className="text-xs text-gray-500 ml-2">(구글맵에서 검색)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={
                      category === 'accommodation' ? '호텔명 또는 주소 (예: 부다페스트 힐튼 호텔)' :
                      category === 'dining' ? '식당명 또는 주소 (예: 중앙시장)' :
                      '장소명 또는 주소'
                    }
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const searchQuery = encodeURIComponent(formData.address || formData.title || '');
                      window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                    }}
                    disabled={!formData.address && !formData.title}
                    className="px-4 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    🔍 검색
                  </button>
                </div>
              </div>

              {/* Google Maps URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  구글맵 주소 (URL)
                  <span className="text-xs text-gray-500 ml-2">(맵뷰 표시용)</span>
                </label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="위에서 검색 후 구글맵 URL을 복사해서 붙여넣으세요"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 위에서 🔍 검색 → 구글맵에서 정확한 위치 찾기 → 주소창 URL 복사 → 여기 붙여넣기
                </p>
              </div>
            </div>
          )}

          {/* Reservation Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">예약 상태</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reservation_status: '예정' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.reservation_status === '예정'
                    ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-150'
                }`}
              >
                예정
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reservation_status: '완료' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.reservation_status === '완료'
                    ? 'bg-green-200 text-green-800 ring-2 ring-green-400'
                    : 'bg-green-100 text-green-700 hover:bg-green-150'
                }`}
              >
                완료
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, reservation_status: '불필요' })}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  formData.reservation_status === '불필요'
                    ? 'bg-blue-200 text-blue-800 ring-2 ring-blue-400'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-150'
                }`}
              >
                불필요
              </button>
            </div>
          </div>

          {/* Category Specific Fields */}
          {category === 'accommodation' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4 border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">🏨 숙소 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">주소</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 border-2 border-blue-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">체크인/체크아웃</label>
                  <input
                    type="text"
                    value={formData.checkin_checkout || ''}
                    onChange={(e) => setFormData({ ...formData, checkin_checkout: e.target.value })}
                    placeholder="15:00 / 11:00"
                    className="w-full p-3 border-2 border-blue-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">숙박 기간</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="2박 3일"
                    className="w-full p-3 border-2 border-blue-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'dining' && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4 border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">🍽️ 식당 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-2">식당 이름</label>
                  <input
                    type="text"
                    value={formData.restaurant_name || ''}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    className="w-full p-3 border-2 border-green-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-2">메뉴</label>
                  <input
                    type="text"
                    value={formData.menu || ''}
                    onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
                    className="w-full p-3 border-2 border-green-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-2">예약 시간</label>
                  <input
                    type="time"
                    value={formData.reservation_time || ''}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    className="w-full p-3 border-2 border-green-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-green-800 mb-2">주소</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 border-2 border-green-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'activity' && (
            <div className="bg-purple-50 p-4 rounded-lg space-y-4 border-2 border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3">🎭 관광 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-purple-800 mb-2">소요 시간</label>
                  <input
                    type="text"
                    value={formData.activity_duration || ''}
                    onChange={(e) => setFormData({ ...formData, activity_duration: e.target.value })}
                    placeholder="2시간"
                    className="w-full p-3 border-2 border-purple-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-800 mb-2">입장료</label>
                  <input
                    type="text"
                    value={formData.entrance_fee || ''}
                    onChange={(e) => setFormData({ ...formData, entrance_fee: e.target.value })}
                    placeholder="15,000원"
                    className="w-full p-3 border-2 border-purple-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-800 mb-2">운영 시간</label>
                  <input
                    type="text"
                    value={formData.operating_hours || ''}
                    onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                    placeholder="09:00-18:00"
                    className="w-full p-3 border-2 border-purple-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'transport' && (
            <div className="bg-orange-50 p-4 rounded-lg space-y-4 border-2 border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">🚌 교통 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">출발지</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.departure || ''}
                      onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                      placeholder="부다페스트 공항"
                      className="flex-1 p-3 border-2 border-orange-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const searchQuery = encodeURIComponent(formData.departure || '');
                        window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                      }}
                      disabled={!formData.departure}
                      className="px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      🔍 검색
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">도착지</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.arrival || ''}
                      onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                      placeholder="부다페스트 숙소"
                      className="flex-1 p-3 border-2 border-orange-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const searchQuery = encodeURIComponent(formData.arrival || '');
                        window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                      }}
                      disabled={!formData.arrival}
                      className="px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      🔍 검색
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-orange-800 mb-2">출발지 구글맵 주소</label>
                  <input
                    type="url"
                    value={formData.departure_google_maps_url || ''}
                    onChange={(e) => setFormData({ ...formData, departure_google_maps_url: e.target.value })}
                    placeholder="위 검색 버튼으로 구글맵에서 찾은 후 URL을 복사해서 붙여넣으세요"
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-orange-800 mb-2">도착지 구글맵 주소</label>
                  <input
                    type="url"
                    value={formData.arrival_google_maps_url || ''}
                    onChange={(e) => setFormData({ ...formData, arrival_google_maps_url: e.target.value })}
                    placeholder="위 검색 버튼으로 구글맵에서 찾은 후 URL을 복사해서 붙여넣으세요"
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">출발 시간</label>
                  <input
                    type="time"
                    value={formData.departure_time || ''}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">도착 시간</label>
                  <input
                    type="time"
                    value={formData.arrival_time || ''}
                    onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">교통수단</label>
                  <input
                    type="text"
                    value={formData.transport_method || ''}
                    onChange={(e) => setFormData({ ...formData, transport_method: e.target.value })}
                    placeholder="택시, 기차, 버스 등"
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-orange-800 mb-2">소요 시간 (선택사항)</label>
                  <input
                    type="text"
                    value={formData.travel_duration || ''}
                    onChange={(e) => setFormData({ ...formData, travel_duration: e.target.value })}
                    placeholder="3시간"
                    className="w-full p-3 border-2 border-orange-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'tour' && (
            <div className="bg-yellow-50 p-4 rounded-lg space-y-4 border-2 border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3">🎯 투어 정보</h4>

              {/* 집합 장소 & 시간 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-yellow-800 mb-2">집합 장소</label>
                  <input
                    type="text"
                    value={formData.meeting_location || ''}
                    onChange={(e) => setFormData({ ...formData, meeting_location: e.target.value })}
                    placeholder="예: 호텔 로비"
                    className="w-full p-3 border-2 border-yellow-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-yellow-800 mb-2">집합 시간</label>
                  <input
                    type="time"
                    value={formData.meeting_time || ''}
                    onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                    className="w-full p-3 border-2 border-yellow-300 rounded-lg"
                  />
                </div>
              </div>

              {/* 가이드 정보 */}
              <div>
                <label className="block text-sm font-semibold text-yellow-800 mb-2">가이드 정보</label>
                <input
                  type="text"
                  value={formData.tour_guide || ''}
                  onChange={(e) => setFormData({ ...formData, tour_guide: e.target.value })}
                  placeholder="예: 김투어 가이드 (010-1234-5678)"
                  className="w-full p-3 border-2 border-yellow-300 rounded-lg"
                />
              </div>

              {/* 투어 스팟 목록 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-yellow-800">투어 스팟</label>
                  <button
                    type="button"
                    onClick={addTourSpot}
                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-all"
                  >
                    + 스팟 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.tour_spots?.map((spot: any, index: number) => (
                    <div key={spot.id} className="bg-white p-3 rounded-lg border-2 border-yellow-300 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-yellow-700">스팟 #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeTourSpot(spot.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={spot.name}
                            onChange={(e) => updateTourSpot(spot.id, 'name', e.target.value)}
                            placeholder="장소명"
                            className="p-2 border-2 border-yellow-200 rounded-lg"
                          />
                          <input
                            type="text"
                            value={spot.duration}
                            onChange={(e) => updateTourSpot(spot.id, 'duration', e.target.value)}
                            placeholder="소요 시간 (예: 1시간 30분)"
                            className="p-2 border-2 border-yellow-200 rounded-lg"
                          />
                        </div>
                        <textarea
                          value={spot.details || ''}
                          onChange={(e) => updateTourSpot(spot.id, 'details', e.target.value)}
                          placeholder="상세 정보 (예: 입장료, 특이사항 등)"
                          rows={2}
                          className="w-full p-2 border-2 border-yellow-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                  {(!formData.tour_spots || formData.tour_spots.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">스팟을 추가해주세요</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-all"
            >
              {saving ? '저장 중...' : '✨ 일정 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ScheduleCategory, ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';
import { supabase } from '../../lib/supabase';
import { Currency } from '../../lib/currency';
import CostInput from './CostInput';
import AutoExpandTextarea from './AutoExpandTextarea';
import PlaceAutocomplete from './PlaceAutocomplete';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  onSuccess: () => void;
  projectId: string;
  mode: 'add' | 'edit';
  schedule?: ScheduleItem;
}

const categoryLabels: Record<ScheduleCategory, string> = {
  accommodation: '🏨 숙소',
  dining: '🍽️ 식사',
  activity: '🎭 관광/액티비티',
  transport: '🚌 이동/교통',
  tour: '🎯 투어',
};


export default function ScheduleModal({ isOpen, onClose, cities, onSuccess, projectId, mode, schedule }: ScheduleModalProps) {
  const [category, setCategory] = useState<ScheduleCategory>('activity');
  const [selectedCityId, setSelectedCityId] = useState<string>(cities[0]?.id || '');
  const [formData, setFormData] = useState<any>({
    date: '',
    time: '09:00',
    title: '',
    details: '',
    cost: '',
    currency: 'KRW' as Currency,
    num_people: 1,
    google_maps_url: '',
    reservation_status: '예정',
    tour_spots: [],
    // Accommodation fields
    checkin_date: '',
    checkin_time: '15:00',
    checkout_date: '',
    checkout_time: '10:00',
  });
  const [saving, setSaving] = useState(false);

  // formData 초기화 함수
  const resetFormData = () => {
    setFormData({
      date: '',
      time: '09:00',
      title: '',
      details: '',
      cost: '',
      currency: 'KRW' as Currency,
      num_people: 1,
      google_maps_url: '',
      reservation_status: '예정',
      tour_spots: [],
      // Accommodation fields
      checkin_date: '',
      checkin_time: '15:00',
      checkout_date: '',
      checkout_time: '10:00',
      // Transport fields
      departure_date: '',
      arrival_date: '',
      departure_time: '09:00',
      arrival_time: '12:00',
      departure_city: '',
      arrival_city: '',
      departure: '',
      arrival: '',
      transport_method: '',
      travel_duration: '',
      departure_google_maps_url: '',
      arrival_google_maps_url: '',
      // Dining fields
      restaurant_name: '',
      menu: '',
      reservation_time: '',
      address: '',
      // Activity fields
      activity_duration: '',
      entrance_fee: '',
      operating_hours: '',
      // Tour fields
      tour_guide: '',
    });
    setCategory('activity');
    setSelectedCityId(cities[0]?.id || '');
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add 모드일 때만 초기화
      if (mode === 'add') {
        resetFormData();
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, mode]);

  // Populate formData when in edit mode
  useEffect(() => {
    if (mode === 'edit' && schedule) {
      setCategory(schedule.category);
      if (schedule.city_id) {
        setSelectedCityId(schedule.city_id);
      }

      // Parse tour details if it's a tour category
      let parsedDetails = schedule.details || '';
      let tourGuide = '';
      let tourSpots: any[] = [];

      if (schedule.category === 'tour' && schedule.details) {
        try {
          const tourData = JSON.parse(schedule.details);
          parsedDetails = tourData.userDetails || '';
          tourGuide = tourData.tour_guide || '';
          tourSpots = tourData.tour_spots || [];
        } catch (e) {
          // If parsing fails, use the raw details
          parsedDetails = schedule.details;
        }
      }

      setFormData({
        date: schedule.date || '',
        time: schedule.time || '09:00',
        title: schedule.title || '',
        details: parsedDetails,
        cost: schedule.cost || '',
        currency: schedule.currency || 'KRW',
        num_people: schedule.num_people || 1,
        google_maps_url: schedule.google_maps_url || '',
        reservation_status: schedule.reservation?.status || '예정',
        tour_spots: tourSpots,
        tour_guide: tourGuide,
        // Category-specific fields
        address: schedule.address || '',
        checkin_checkout: schedule.checkin_checkout || '',
        duration: schedule.duration || '',
        restaurant_name: schedule.restaurant_name || '',
        menu: schedule.menu || '',
        reservation_time: schedule.reservation_time || '',
        activity_duration: schedule.activity_duration || '',
        entrance_fee: schedule.entrance_fee || '',
        operating_hours: schedule.operating_hours || '',
        departure: schedule.departure || '',
        arrival: schedule.arrival || '',
        transport_method: schedule.transport_method || '',
        travel_duration: schedule.travel_duration || '',
        departure_google_maps_url: schedule.departure_google_maps_url || '',
        arrival_google_maps_url: schedule.arrival_google_maps_url || '',
        departure_time: schedule.departure_time || '',
        arrival_time: schedule.arrival_time || '',
        departure_date: '',
        arrival_date: '',
        departure_city: '',
        arrival_city: '',
        // Accommodation fields
        checkin_date: '',
        checkin_time: '15:00',
        checkout_date: '',
        checkout_time: '10:00',
      });
    }
  }, [mode, schedule]);

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

    if (!formData.date || !formData.title) {
      alert('필수 항목을 모두 입력해주세요!');
      return;
    }

    setSaving(true);

    try {
      const selectedCity = cities.find(c => c.id === selectedCityId);

      // For tour category, save tour-specific data in details field as JSON
      let detailsToSave = formData.details;
      if (category === 'tour') {
        const tourData = {
          userDetails: formData.details, // User's custom notes
          tour_guide: formData.tour_guide,
          tour_spots: formData.tour_spots || [],
        };
        detailsToSave = JSON.stringify(tourData);
      }

      const baseData = {
        city: selectedCity?.name,
        city_id: selectedCityId,
        category: category,
        date: formData.date,
        time: formData.time,
        title: formData.title,
        details: detailsToSave,
        cost: formData.cost,
        currency: formData.currency,
        num_people: formData.num_people || 1,
        google_maps_url: formData.google_maps_url,
        reservation_completed: formData.reservation_status === '완료',
        reservation_status: formData.reservation_status,
      };

      // Accommodation: Create 2 items (checkin + checkout)
      if (category === 'accommodation') {
        if (!formData.checkin_date || !formData.checkout_date) {
          alert('체크인/체크아웃 날짜를 입력해주세요!');
          setSaving(false);
          return;
        }

        // Calculate stay duration
        const checkinDate = new Date(formData.checkin_date);
        const checkoutDate = new Date(formData.checkout_date);
        const nightsDiff = Math.floor(
          (checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (nightsDiff <= 0) {
          alert('체크아웃 날짜는 체크인 날짜보다 이후여야 합니다!');
          setSaving(false);
          return;
        }

        const stayDuration = `${nightsDiff}박`;

        if (mode === 'add') {
          // 1. Create checkin item
          const { data: checkinData, error: checkinError } = await supabase
            .from('schedules')
            .insert({
              ...baseData,
              date: formData.checkin_date,
              time: formData.checkin_time,
              title: `${formData.title} (체크인)`,
              address: formData.address,
              accommodation_type: 'checkin',
              stay_duration: stayDuration,
              total_nights: nightsDiff,
              project_id: projectId,
            })
            .select()
            .single();

          if (checkinError) throw checkinError;

          // 2. Create checkout item
          const { data: checkoutData, error: checkoutError } = await supabase
            .from('schedules')
            .insert({
              ...baseData,
              date: formData.checkout_date,
              time: formData.checkout_time,
              title: `${formData.title} (체크아웃)`,
              address: formData.address,
              accommodation_type: 'checkout',
              linked_accommodation_id: checkinData.id,
              stay_duration: stayDuration,
              total_nights: nightsDiff,
              project_id: projectId,
            })
            .select()
            .single();

          if (checkoutError) throw checkoutError;

          // 3. Update checkin item with checkout ID
          await supabase
            .from('schedules')
            .update({ linked_accommodation_id: checkoutData.id })
            .eq('id', checkinData.id);

          // Success - reset and close
          resetFormData();
          onSuccess();
          onClose();
          setSaving(false);
          return; // Exit early for accommodation
        } else if (mode === 'edit' && schedule?.id) {
          // Edit mode for accommodation
          // TODO: Handle edit mode for checkin/checkout items
          alert('숙소 수정 기능은 곧 추가됩니다!');
          setSaving(false);
          return;
        }
      }

      // Transport: Create 2 items (departure + arrival)
      if (category === 'transport') {
        if (!formData.departure_date || !formData.arrival_date) {
          alert('출발/도착 날짜를 입력해주세요!');
          setSaving(false);
          return;
        }

        if (!formData.departure_city || !formData.arrival_city) {
          alert('출발/도착 도시를 입력해주세요!');
          setSaving(false);
          return;
        }

        if (mode === 'add') {
          // 1. Create departure item
          const { data: departureData, error: departureError } = await supabase
            .from('schedules')
            .insert({
              ...baseData,
              date: formData.departure_date,
              time: formData.departure_time || '09:00',
              title: `${formData.title} (출발)`,
              city: formData.departure_city,
              google_maps_url: formData.departure_google_maps_url,
              departure: formData.departure,
              arrival: formData.arrival,
              departure_city: formData.departure_city,
              arrival_city: formData.arrival_city,
              transport_method: formData.transport_method,
              travel_duration: formData.travel_duration,
              departure_google_maps_url: formData.departure_google_maps_url,
              arrival_google_maps_url: formData.arrival_google_maps_url,
              departure_time: formData.departure_time,
              arrival_time: formData.arrival_time,
              transport_type: 'departure',
              project_id: projectId,
            })
            .select()
            .single();

          if (departureError) throw departureError;

          // 2. Create arrival item
          const { data: arrivalData, error: arrivalError } = await supabase
            .from('schedules')
            .insert({
              ...baseData,
              date: formData.arrival_date,
              time: formData.arrival_time || '12:00',
              title: `${formData.title} (도착)`,
              city: formData.arrival_city,
              google_maps_url: formData.arrival_google_maps_url,
              departure: formData.departure,
              arrival: formData.arrival,
              departure_city: formData.departure_city,
              arrival_city: formData.arrival_city,
              transport_method: formData.transport_method,
              travel_duration: formData.travel_duration,
              departure_google_maps_url: formData.departure_google_maps_url,
              arrival_google_maps_url: formData.arrival_google_maps_url,
              departure_time: formData.departure_time,
              arrival_time: formData.arrival_time,
              transport_type: 'arrival',
              linked_transport_id: departureData.id,
              project_id: projectId,
            })
            .select()
            .single();

          if (arrivalError) throw arrivalError;

          // 3. Update departure item with arrival ID
          await supabase
            .from('schedules')
            .update({ linked_transport_id: arrivalData.id })
            .eq('id', departureData.id);

          // Success - reset and close
          resetFormData();
          onSuccess();
          onClose();
          setSaving(false);
          return; // Exit early for transport
        } else if (mode === 'edit' && schedule?.id) {
          // Edit mode for transport
          // TODO: Handle edit mode for departure/arrival items
          alert('교통 수정 기능은 곧 추가됩니다!');
          setSaving(false);
          return;
        }
      }

      // Category-specific data (for dining, activity, tour only)
      // Note: accommodation and transport are handled above with early return
      let categoryData = {};
      if (category === 'dining') {
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
      }
      // Note: tour category no longer adds to categoryData

      if (mode === 'add') {
        // INSERT for add mode
        const { error } = await supabase.from('schedules').insert({
          ...baseData,
          ...categoryData,
          project_id: projectId,
        });

        if (error) {
          throw error;
        }
      } else if (mode === 'edit' && schedule?.id) {
        // UPDATE for edit mode
        const { error } = await supabase.from('schedules').update({
          ...baseData,
          ...categoryData,
        }).eq('id', schedule.id);

        if (error) {
          throw error;
        }
      }

      // Reset form
      resetFormData();
      onSuccess();
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'add' ? '✨ 새 일정 추가' : '✏️ 일정 수정'}
          </h2>
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
            {/* City - 교통은 각 출발/도착에서 입력받으므로 숨김 */}
            {category !== 'transport' && (
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
            )}

            {/* Date - 숙소와 교통은 각각의 입력란에서 받으므로 숨김 */}
            {category !== 'accommodation' && category !== 'transport' && (
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
            )}

            {/* Time - 숙소와 교통은 각각의 입력란에서 받으므로 숨김 */}
            {category !== 'accommodation' && category !== 'transport' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">시간</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
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
            <AutoExpandTextarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="상세 일정"
              minRows={3}
              maxRows={10}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Cost with Currency Selector and Number of People */}
          <CostInput
            amount={formData.cost}
            currency={formData.currency}
            numPeople={formData.num_people}
            onAmountChange={(amount) => setFormData({ ...formData, cost: amount })}
            onCurrencyChange={(currency) => setFormData({ ...formData, currency })}
            onNumPeopleChange={(numPeople) => setFormData({ ...formData, num_people: numPeople })}
            placeholder="50,000"
          />

          {/* Google Maps - Hide for transport category */}
          {category !== 'transport' && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {category === 'tour' ? '집합 장소' : '장소 검색'}
                  <span className="text-xs text-gray-500 ml-2">(자동완성)</span>
                </label>
                <PlaceAutocomplete
                  value={formData.address || ''}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  onPlaceSelect={(place) => {
                    setFormData({
                      ...formData,
                      address: place.address,
                      google_maps_url: place.google_maps_url,
                      title: formData.title || place.name,
                    });
                  }}
                  placeholder={
                    category === 'accommodation' ? '호텔명 또는 주소 (예: 부다페스트 힐튼 호텔)' :
                    category === 'dining' ? '식당명 또는 주소 (예: 중앙시장)' :
                    category === 'tour' ? '집합 장소 (예: 호텔 로비, 중앙역 앞)' :
                    '장소명 또는 주소를 입력하세요'
                  }
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 장소를 입력하면 자동으로 후보가 나타납니다. 선택하면 구글맵 좌표가 자동 저장됩니다.
                </p>
              </div>

              {/* 선택된 구글맵 URL 표시 (선택사항) */}
              {formData.google_maps_url && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-green-700 font-medium">장소가 선택되었습니다</span>
                  <a
                    href={formData.google_maps_url}
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

              {/* Check-in */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-800 mb-3">체크인</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">날짜 *</label>
                    <input
                      type="date"
                      value={formData.checkin_date || ''}
                      onChange={(e) => setFormData({ ...formData, checkin_date: e.target.value })}
                      className="w-full p-2 border-2 border-blue-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">시간</label>
                    <input
                      type="time"
                      value={formData.checkin_time || '15:00'}
                      onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                      className="w-full p-2 border-2 border-blue-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Check-out */}
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-800 mb-3">체크아웃</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">날짜 *</label>
                    <input
                      type="date"
                      value={formData.checkout_date || ''}
                      onChange={(e) => setFormData({ ...formData, checkout_date: e.target.value })}
                      className="w-full p-2 border-2 border-blue-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">시간</label>
                    <input
                      type="time"
                      value={formData.checkout_time || '10:00'}
                      onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
                      className="w-full p-2 border-2 border-blue-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Auto-calculated duration */}
              {formData.checkin_date && formData.checkout_date && (
                <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
                  <p className="text-sm text-blue-900">
                    ℹ️ 숙박 기간: <strong>
                      {Math.floor(
                        (new Date(formData.checkout_date).getTime() - new Date(formData.checkin_date).getTime())
                        / (1000 * 60 * 60 * 24)
                      )}박
                    </strong> (자동 계산)
                  </p>
                </div>
              )}
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

              {/* 출발 정보 */}
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">🛫 출발</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">출발 날짜 *</label>
                    <input
                      type="date"
                      value={formData.departure_date || ''}
                      onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">출발 시간</label>
                    <input
                      type="time"
                      value={formData.departure_time || '09:00'}
                      onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">출발 도시 *</label>
                    <input
                      type="text"
                      value={formData.departure_city || ''}
                      onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
                      placeholder="예: 부다페스트"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">출발지 상세</label>
                    <PlaceAutocomplete
                      value={formData.departure || ''}
                      onChange={(value) => setFormData({ ...formData, departure: value })}
                      onPlaceSelect={(place) => {
                        setFormData({
                          ...formData,
                          departure: place.name,
                          departure_google_maps_url: place.google_maps_url,
                        });
                      }}
                      placeholder="출발지 입력 (예: 부다페스트 공항)"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    />
                    {formData.departure_google_maps_url && (
                      <a
                        href={formData.departure_google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-800 underline mt-1 inline-block"
                      >
                        ✓ 출발지 확인
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 도착 정보 */}
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h5 className="text-sm font-semibold text-orange-800 mb-3">🛬 도착</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">도착 날짜 *</label>
                    <input
                      type="date"
                      value={formData.arrival_date || ''}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">도착 시간</label>
                    <input
                      type="time"
                      value={formData.arrival_time || '12:00'}
                      onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">도착 도시 *</label>
                    <input
                      type="text"
                      value={formData.arrival_city || ''}
                      onChange={(e) => setFormData({ ...formData, arrival_city: e.target.value })}
                      placeholder="예: 빈"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">도착지 상세</label>
                    <PlaceAutocomplete
                      value={formData.arrival || ''}
                      onChange={(value) => setFormData({ ...formData, arrival: value })}
                      onPlaceSelect={(place) => {
                        setFormData({
                          ...formData,
                          arrival: place.name,
                          arrival_google_maps_url: place.google_maps_url,
                        });
                      }}
                      placeholder="도착지 입력 (예: 빈 숙소)"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    />
                    {formData.arrival_google_maps_url && (
                      <a
                        href={formData.arrival_google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-800 underline mt-1 inline-block"
                      >
                        ✓ 도착지 확인
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 교통수단 정보 */}
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">교통수단</label>
                    <input
                      type="text"
                      value={formData.transport_method || ''}
                      onChange={(e) => setFormData({ ...formData, transport_method: e.target.value })}
                      placeholder="택시, 기차, 버스 등"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">소요 시간 (선택사항)</label>
                    <input
                      type="text"
                      value={formData.travel_duration || ''}
                      onChange={(e) => setFormData({ ...formData, travel_duration: e.target.value })}
                      placeholder="3시간"
                      className="w-full p-2 border-2 border-orange-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 자동 계산된 이동 시간 표시 */}
              {formData.departure_date && formData.arrival_date && formData.departure_time && formData.arrival_time && (
                <div className="bg-orange-100 p-3 rounded-lg border border-orange-300">
                  <p className="text-sm text-orange-900">
                    ℹ️ 이동 시간: <strong>
                      {(() => {
                        const depDateTime = new Date(`${formData.departure_date}T${formData.departure_time}`);
                        const arrDateTime = new Date(`${formData.arrival_date}T${formData.arrival_time}`);
                        const diffMs = arrDateTime.getTime() - depDateTime.getTime();
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        return `${diffHours}시간 ${diffMins}분`;
                      })()}
                    </strong> (자동 계산)
                  </p>
                </div>
              )}
            </div>
          )}

          {category === 'tour' && (
            <div className="bg-yellow-50 p-4 rounded-lg space-y-4 border-2 border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3">🎯 투어 정보</h4>
              <p className="text-xs text-yellow-700 mb-3">💡 집합 장소와 시간은 위의 공통 입력 섹션을 사용하세요</p>

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
                        <AutoExpandTextarea
                          value={spot.details || ''}
                          onChange={(e) => updateTourSpot(spot.id, 'details', e.target.value)}
                          placeholder="상세 정보 (예: 입장료, 특이사항 등)"
                          minRows={2}
                          maxRows={8}
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
            {mode === 'edit' && (
              <button
                type="button"
                onClick={async () => {
                  if (!schedule?.id) return;
                  if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return;

                  try {
                    const { error } = await supabase.from('schedules').delete().eq('id', schedule.id);
                    if (error) throw error;
                    onSuccess();
                    onClose();
                  } catch (error) {
                    console.error('Failed to delete schedule:', error);
                    alert('일정 삭제 실패! 다시 시도해주세요.');
                  }
                }}
                className="py-3 px-6 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                삭제
              </button>
            )}
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
              {saving ? '저장 중...' : (mode === 'add' ? '✨ 일정 추가' : '✏️ 일정 수정')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

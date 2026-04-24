'use client';

import { useState } from 'react';
import { CityName, ScheduleCategory } from '../types/schedule';
import { supabase } from '../../lib/supabase';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityName;
  onScheduleAdded: () => void;
}

export default function AddScheduleModal({ isOpen, onClose, city, onScheduleAdded }: AddScheduleModalProps) {
  const [category, setCategory] = useState<ScheduleCategory>('activity');
  const [formData, setFormData] = useState<any>({
    date: '',
    day_of_week: '',
    time: '',
    title: '',
    details: '',
    cost: '',
    google_maps_url: '',
    reservation_required: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const baseData = {
        city: city,
        category: category,
        date: formData.date,
        day_of_week: formData.day_of_week,
        time: formData.time,
        title: formData.title,
        details: formData.details,
        cost: formData.cost,
        google_maps_url: formData.google_maps_url,
        reservation_required: formData.reservation_required,
        reservation_completed: false,
        reservation_status: '시작 전',
      };

      // Add category-specific fields
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
        };
      }

      const { error } = await supabase.from('schedules').insert({
        ...baseData,
        ...categoryData,
      });

      if (error) throw error;

      // Reset form
      setFormData({
        date: '',
        day_of_week: '',
        time: '',
        title: '',
        details: '',
        cost: '',
        google_maps_url: '',
        reservation_required: false,
      });
      setCategory('activity');

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">새 일정 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              도시
            </label>
            <input
              type="text"
              value={city}
              disabled
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              날짜 *
            </label>
            <input
              type="text"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="예: 4/26"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 세체니온천"
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              상세 내용
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="상세 일정을 입력하세요..."
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="reservation"
              checked={formData.reservation_required}
              onChange={(e) => setFormData({ ...formData, reservation_required: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="reservation" className="ml-2 text-sm text-gray-700">
              예약 필요
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
            >
              {saving ? '저장 중...' : '추가하기'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-semibold"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ScheduleItem, ScheduleCategory } from '../types/schedule';
import { City } from '../types/tripSettings';
import { supabase } from '../../lib/supabase';
import { Currency } from '../../lib/currency';
import CostDisplay from './CostDisplay';
import CostEditModal from './CostEditModal';
import { Linkify } from '../../lib/linkify';

interface TableViewProps {
  schedules: ScheduleItem[];
  cities: City[];
  onUpdate: () => void;
}

const categoryLabels: Record<ScheduleCategory, string> = {
  accommodation: '🏨 숙소',
  dining: '🍽️ 식사',
  activity: '🎭 관광',
  transport: '🚌 교통',
  tour: '🎯 투어',
};

export default function TableView({ schedules, cities, onUpdate }: TableViewProps) {
  const [filterCategory, setFilterCategory] = useState<ScheduleCategory | 'all'>('all');
  const [filterCity, setFilterCity] = useState<string | 'all'>('all');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editCurrency, setEditCurrency] = useState('KRW');
  const [sortBy, setSortBy] = useState<'time' | 'category' | 'city'>('time');

  // Cost edit modal state
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [editingCostSchedule, setEditingCostSchedule] = useState<ScheduleItem | null>(null);

  // Filter schedules
  let filteredSchedules = [...schedules];
  if (filterCategory !== 'all') {
    filteredSchedules = filteredSchedules.filter(s => s.category === filterCategory);
  }
  if (filterCity !== 'all') {
    filteredSchedules = filteredSchedules.filter(s => s.city_id === filterCity);
  }

  // Sort schedules
  filteredSchedules.sort((a, b) => {
    if (sortBy === 'time') {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;

      // If same date, sort by time (earlier times first)
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    } else {
      return (a.city || '').localeCompare(b.city || '');
    }
  });

  const updateField = async (scheduleId: string, field: string, value: any) => {
    const updateData: any = {};
    updateData[field] = value;

    const { error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', scheduleId);

    if (error) {
      console.error('Failed to update:', error);
      alert('업데이트 실패!');
    } else {
      onUpdate();
    }
  };

  const startEditing = (id: string, field: string, currentValue: any, currency?: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
    if (field === 'cost') {
      setEditCurrency(currency || 'KRW');
      console.log('🔧 Starting edit with currency:', currency || 'KRW');
    }
  };

  const saveEdit = async (schedule: ScheduleItem) => {
    if (!editingCell || !schedule.id) return;

    try {
      // For cost field, also save currency
      if (editingCell.field === 'cost') {
        console.log('💰 Saving cost:', {
          cost: editValue,
          currency: editCurrency,
          scheduleId: schedule.id
        });

        const { data, error } = await supabase
          .from('schedules')
          .update({ cost: editValue, currency: editCurrency })
          .eq('id', schedule.id)
          .select();

        if (error) {
          console.error('Failed to update cost:', error);
          alert('비용 업데이트 실패!');
          return;
        }

        console.log('✅ Updated successfully:', data);
      } else if (editingCell.field === 'date') {
        // Update date only
        const { error } = await supabase
          .from('schedules')
          .update({ date: editValue })
          .eq('id', schedule.id);

        if (error) {
          console.error('Failed to update date:', error);
          alert('날짜 업데이트 실패!');
          return;
        }
      } else {
        await updateField(schedule.id, editingCell.field, editValue);
      }

      setEditingCell(null);
      onUpdate();
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 실패!');
    }
  };

  const cycleReservationStatus = async (schedule: ScheduleItem) => {
    if (!schedule.id) return;

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

    const { error } = await supabase
      .from('schedules')
      .update({
        reservation_status: nextStatus,
        reservation_completed: nextStatus === '완료',
      })
      .eq('id', schedule.id);

    if (!error) {
      onUpdate();
    }
  };

  const deleteSchedule = async (schedule: ScheduleItem) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (!schedule.id) return;

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', schedule.id);

    if (!error) {
      onUpdate();
    } else {
      alert('삭제 실패!');
    }
  };

  // Category Select Cell
  const renderCategoryCell = (schedule: ScheduleItem) => {
    const isEditing = editingCell?.id === schedule.id && editingCell?.field === 'category';

    return (
      <td className="px-3 py-2 border-b min-w-[120px]">
        {isEditing ? (
          <div className="flex gap-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(schedule);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => saveEdit(schedule)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(schedule.id!, 'category', schedule.category)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
              schedule.category === 'accommodation' ? 'bg-blue-100 text-blue-800' :
              schedule.category === 'dining' ? 'bg-orange-100 text-orange-800' :
              schedule.category === 'activity' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {categoryLabels[schedule.category]}
            </span>
          </div>
        )}
      </td>
    );
  };

  // City Select Cell
  const renderCityCell = (schedule: ScheduleItem) => {
    const isEditing = editingCell?.id === schedule.id && editingCell?.field === 'city_id';
    const cityName = cities.find(c => c.id === schedule.city_id)?.name || schedule.city_id;

    return (
      <td className="px-3 py-2 border-b min-w-[120px]">
        {isEditing ? (
          <div className="flex gap-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(schedule);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            <button
              onClick={() => saveEdit(schedule)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(schedule.id!, 'city_id', schedule.city_id)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
          >
            {cityName}
          </div>
        )}
      </td>
    );
  };

  // Date Picker Cell
  const renderDateCell = (schedule: ScheduleItem) => {
    const isEditing = editingCell?.id === schedule.id && editingCell?.field === 'date';

    return (
      <td className="px-3 py-2 border-b min-w-[150px]">
        {isEditing ? (
          <div className="flex gap-1">
            <input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(schedule);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <button
              onClick={() => saveEdit(schedule)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(schedule.id!, 'date', schedule.date)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
            title="클릭하여 날짜 선택"
          >
            {schedule.date || <span className="text-gray-400 text-xs">날짜 선택</span>}
          </div>
        )}
      </td>
    );
  };

  // Time Picker Cell
  const renderTimeCell = (schedule: ScheduleItem) => {
    const isEditing = editingCell?.id === schedule.id && editingCell?.field === 'time';

    return (
      <td className="px-3 py-2 border-b min-w-[120px]">
        {isEditing ? (
          <div className="flex gap-1">
            <input
              type="time"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(schedule);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <button
              onClick={() => saveEdit(schedule)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(schedule.id!, 'time', schedule.time)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
            title="클릭하여 시간 선택"
          >
            {schedule.time || <span className="text-gray-400 text-xs">시간 선택</span>}
          </div>
        )}
      </td>
    );
  };

  // Cost Cell with Currency Display
  const renderCostCell = (schedule: ScheduleItem) => {
    return (
      <td className="px-3 py-2 border-b min-w-[200px]">
        <div
          onClick={() => {
            setEditingCostSchedule(schedule);
            setCostModalOpen(true);
          }}
          className="cursor-pointer hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
          title="클릭하여 편집"
        >
          {schedule.cost ? (
            <CostDisplay amount={schedule.cost} currency={schedule.currency} numPeople={schedule.num_people} />
          ) : (
            <span className="text-gray-400 text-xs">💰 클릭하여 입력</span>
          )}
        </div>
      </td>
    );
  };

  const handleCostSave = async (amount: string, currency: Currency, numPeople: number) => {
    if (!editingCostSchedule?.id) return;

    console.log('💾 Saving cost - amount:', amount, 'currency:', currency, 'numPeople:', numPeople);

    const updateData = {
      cost: amount,
      currency: currency,
      num_people: numPeople,
    };

    console.log('💾 Update data:', updateData);

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', editingCostSchedule.id)
      .select();

    if (!error) {
      console.log('✅ Updated successfully:', data);
      onUpdate();
    } else {
      console.error('❌ Failed to update cost:', error);
      alert('비용 업데이트 실패!');
    }
  };

  // Regular Text Cell
  const renderEditableCell = (schedule: ScheduleItem, field: string, value: any, width: string = 'min-w-[150px]') => {
    const isEditing = editingCell?.id === schedule.id && editingCell?.field === field;

    return (
      <td className={`px-3 py-2 border-b ${width}`}>
        {isEditing ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(schedule);
                if (e.key === 'Escape') setEditingCell(null);
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <button
              onClick={() => saveEdit(schedule)}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => startEditing(schedule.id!, field, value)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[30px] text-sm"
            title="클릭하여 편집"
          >
            {value ? <Linkify>{value}</Linkify> : <span className="text-gray-400 text-xs">클릭하여 입력</span>}
          </div>
        )}
      </td>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">카테고리:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">전체</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">도시:</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">전체</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">정렬:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="time">시간순</option>
              <option value="category">카테고리순</option>
              <option value="city">도시순</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-600">
            총 {filteredSchedules.length}개 일정
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[60px]">#</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">카테고리</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">도시</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[150px]">날짜</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">시간</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[200px]">제목</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[250px]">상세</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">비용</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">예약</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">링크</th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchedules.map((schedule, index) => (
                <tr key={schedule.id || index} className="hover:bg-gray-50">
                  {/* Index */}
                  <td className="px-3 py-2 border-b text-sm font-semibold text-indigo-600">
                    {index + 1}
                  </td>

                  {/* Category - Select */}
                  {renderCategoryCell(schedule)}

                  {/* City - Select */}
                  {renderCityCell(schedule)}

                  {/* Date - Date Picker */}
                  {renderDateCell(schedule)}

                  {/* Time - Time Picker */}
                  {renderTimeCell(schedule)}

                  {/* Title - Text Input */}
                  {renderEditableCell(schedule, 'title', schedule.title, 'min-w-[200px]')}

                  {/* Details - Text Input */}
                  {renderEditableCell(schedule, 'details', schedule.details, 'min-w-[250px]')}

                  {/* Cost with Currency Display */}
                  {renderCostCell(schedule)}

                  {/* Reservation - 3-State Cycle Button */}
                  <td className="px-3 py-2 border-b min-w-[100px]">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => cycleReservationStatus(schedule)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:shadow-md ${
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
                  </td>

                  {/* Links */}
                  <td className="px-3 py-2 border-b min-w-[80px]">
                    <div className="flex gap-1">
                      {schedule.google_maps_url && (
                        <a
                          href={schedule.google_maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                          title="구글맵"
                        >
                          📍
                        </a>
                      )}
                      {schedule.reservation_link && (
                        <a
                          href={schedule.reservation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                          title="예약 링크"
                        >
                          🔗
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2 border-b min-w-[80px]">
                    <button
                      onClick={() => deleteSchedule(schedule)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchedules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            일정이 없습니다.
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        💡 <strong>사용법:</strong> 셀을 클릭하여 편집할 수 있습니다.
        카테고리와 도시는 드롭다운에서 선택하고, 날짜와 시간은 피커를 사용하세요.
        Enter로 저장, Escape로 취소합니다.
      </div>

      {/* Cost Edit Modal */}
      <CostEditModal
        isOpen={costModalOpen}
        onClose={() => {
          setCostModalOpen(false);
          setEditingCostSchedule(null);
        }}
        onSave={handleCostSave}
        initialAmount={editingCostSchedule?.cost || ''}
        initialCurrency={(editingCostSchedule?.currency as Currency) || 'KRW'}
        initialNumPeople={editingCostSchedule?.num_people || 1}
      />
    </div>
  );
}

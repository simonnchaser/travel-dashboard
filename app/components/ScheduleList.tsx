'use client';

import { useState } from 'react';
import { ScheduleItem } from '../types/schedule';
import ScheduleCard from './ScheduleCard_v2';
import { supabase } from '../../lib/supabase';

interface ScheduleListProps {
  schedules: ScheduleItem[];
  cityId: string;
  cityName: string;
  onUpdate: (schedules: ScheduleItem[]) => void;
}

export default function ScheduleList({ schedules, cityId, cityName, onUpdate }: ScheduleListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const updateScheduleItem = async (index: number, updatedItem: ScheduleItem) => {
    // Update in Supabase
    if (updatedItem.id) {
      const { error } = await supabase
        .from('schedules')
        .update({
          reservation_completed: updatedItem.reservation.completed,
          reservation_status: updatedItem.reservation.status,
          notes: updatedItem.notes
        })
        .eq('id', updatedItem.id);

      if (error) {
        console.error('Failed to update schedule:', error);
        alert('저장 실패! 다시 시도해주세요.');
        return;
      }
    }

    // Update local state
    const newSchedules = [...schedules];
    newSchedules[index] = updatedItem;
    onUpdate(newSchedules);
  };

  const deleteScheduleItem = async (index: number, scheduleId?: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    // Delete from Supabase
    if (scheduleId) {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        console.error('Failed to delete schedule:', error);
        alert('삭제 실패! 다시 시도해주세요.');
        return;
      }
    }

    // Update local state
    const newSchedules = schedules.filter((_, i) => i !== index);
    onUpdate(newSchedules);
  };

  if (!schedules || schedules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">이 도시의 일정이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule, index) => (
        <ScheduleCard
          key={schedule.id || index}
          schedule={schedule}
          index={index}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => toggleExpand(index)}
          onUpdate={(updatedItem) => updateScheduleItem(index, updatedItem)}
          onDelete={() => deleteScheduleItem(index, schedule.id)}
        />
      ))}
    </div>
  );
}

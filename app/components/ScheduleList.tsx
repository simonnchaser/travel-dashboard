'use client';

import { useState } from 'react';
import { ScheduleItem, CityName } from '../types/schedule';
import ScheduleCard from './ScheduleCard';

interface ScheduleListProps {
  schedules: ScheduleItem[];
  city: CityName;
  onUpdate: (schedules: ScheduleItem[]) => void;
}

export default function ScheduleList({ schedules, city, onUpdate }: ScheduleListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const updateScheduleItem = (index: number, updatedItem: ScheduleItem) => {
    const newSchedules = [...schedules];
    newSchedules[index] = updatedItem;
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
          key={index}
          schedule={schedule}
          index={index}
          isExpanded={expandedIndex === index}
          onToggleExpand={() => toggleExpand(index)}
          onUpdate={(updatedItem) => updateScheduleItem(index, updatedItem)}
        />
      ))}
    </div>
  );
}

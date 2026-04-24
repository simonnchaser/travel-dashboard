'use client';

import { useState, useEffect } from 'react';
import { ScheduleByCity, CityName } from './types/schedule';
import CityTabs from './components/CityTabs';
import ScheduleList from './components/ScheduleList';
import StatsCard from './components/StatsCard';

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleByCity | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityName>('부다페스트');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/schedule.json')
      .then(res => res.json())
      .then(data => {
        setScheduleData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load schedule:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-indigo-600">일정을 불러오는 중...</div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">일정을 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            ✈️ 프오헝 여행 대시보드
          </h1>
          <p className="text-gray-600 text-lg">2026년 4월 26일 - 5월 6일</p>
        </div>

        {/* Stats Overview */}
        <StatsCard scheduleData={scheduleData} />

        {/* City Tabs */}
        <CityTabs
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          scheduleData={scheduleData}
        />

        {/* Schedule List */}
        <ScheduleList
          schedules={scheduleData[selectedCity]}
          city={selectedCity}
          onUpdate={(updatedSchedules) => {
            setScheduleData({
              ...scheduleData,
              [selectedCity]: updatedSchedules
            });
          }}
        />
      </div>
    </main>
  );
}

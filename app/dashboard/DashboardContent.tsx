'use client';

import { useState, useEffect, useRef } from 'react';
import { ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';
import CityTabs from '../components/CityTabs';
import ScheduleList from '../components/ScheduleList';
import StatsCard from '../components/StatsCard';
import CostKpiDashboard from '../components/CostKpiDashboard';
import AddScheduleModal from '../components/AddScheduleModal_v2';
import TableView from '../components/TableView';
import MapView from '../components/MapView';
import { supabase } from '../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  project_code: string;
  project_name: string;
  countries: string[];
  cities: City[];
  start_date: string;
  end_date: string;
}

type ReservationFilter = 'all' | 'required' | 'completed' | 'unnecessary';

export default function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [project, setProject] = useState<Project | null>(null);
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleItem[]>>({});
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'map'>('card');
  const [reservationFilter, setReservationFilter] = useState<ReservationFilter>('all');
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'city'>('date');

  const cardViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectId) {
      loadData();
    } else {
      router.push('/projects');
    }
  }, [projectId]);

  async function loadData() {
    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      if (!projectData) {
        alert('프로젝트를 찾을 수 없습니다!');
        router.push('/projects');
        return;
      }

      setProject(projectData);

      // Set first city as selected
      if (projectData.cities.length > 0) {
        setSelectedCityId(projectData.cities[0].id);
      }

      // Load schedules for this project
      await fetchSchedules(projectData.cities, projectData.id);
    } catch (err) {
      console.error('Failed to load data:', err);
      setLoading(false);
    }
  }

  async function fetchSchedules(cities: City[], projectId: string) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true });

      if (error) throw error;

      // Group schedules by city_id
      const schedulesByCity: Record<string, ScheduleItem[]> = {};

      // Initialize with empty arrays for all cities
      cities.forEach(city => {
        schedulesByCity[city.id] = [];
      });

      // Group schedules
      data?.forEach((schedule: any) => {
        const item: ScheduleItem = {
          id: schedule.id,
          city: schedule.city,
          city_id: schedule.city_id,
          date: schedule.date,
          day_of_week: schedule.day_of_week || '',
          time: schedule.time,
          title: schedule.title,
          details: schedule.details || '',
          coordinates: schedule.latitude && schedule.longitude
            ? { latitude: parseFloat(schedule.latitude), longitude: parseFloat(schedule.longitude) }
            : null,
          google_maps_url: schedule.google_maps_url,
          reservation: {
            required: schedule.reservation_required,
            completed: schedule.reservation_completed,
            status: schedule.reservation_status || ''
          },
          reservation_link: schedule.reservation_link,
          cost: schedule.cost,
          currency: schedule.currency,
          unit: schedule.unit,
          notes: schedule.notes,
          category: schedule.category || 'activity',

          // Accommodation fields
          address: schedule.address,
          checkin_checkout: schedule.checkin_checkout,
          duration: schedule.duration,

          // Dining fields
          restaurant_name: schedule.restaurant_name,
          menu: schedule.menu,
          reservation_time: schedule.reservation_time,

          // Activity fields
          activity_duration: schedule.activity_duration,
          entrance_fee: schedule.entrance_fee,
          operating_hours: schedule.operating_hours,

          // Transport fields
          departure: schedule.departure,
          arrival: schedule.arrival,
          transport_method: schedule.transport_method,
          travel_duration: schedule.travel_duration,
          departure_google_maps_url: schedule.departure_google_maps_url,
          arrival_google_maps_url: schedule.arrival_google_maps_url,
          departure_time: schedule.departure_time,
          arrival_time: schedule.arrival_time,

          // Legacy fields
          transportation: schedule.transportation,
          meals: schedule.meals
        };

        const cityId = schedule.city_id || 'other';
        if (!schedulesByCity[cityId]) {
          schedulesByCity[cityId] = [];
        }
        schedulesByCity[cityId].push(item);
      });

      setScheduleData(schedulesByCity);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setLoading(false);
    }
  }

  function getCityName(cityId: string): string {
    const city = project?.cities.find(c => c.id === cityId);
    return city?.name || cityId;
  }

  // Scroll to card view and switch to selected city
  function scrollToCardView() {
    if (cardViewRef.current) {
      cardViewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Handle city card click
  function handleCityClick(cityId: string) {
    setViewMode('card');
    setSelectedCityId(cityId);
    setReservationFilter('all');
    setTimeout(() => scrollToCardView(), 100);
  }

  // Handle reservation filter click
  function handleReservationFilterClick(cityId: string, filter: 'required' | 'completed' | 'unnecessary') {
    setViewMode('card');
    setSelectedCityId(cityId);
    setReservationFilter(filter);
    setTimeout(() => scrollToCardView(), 100);
  }

  // Filter and sort schedules
  function getFilteredSchedules(schedules: ScheduleItem[]): ScheduleItem[] {
    // Filter by reservation status
    let filtered = schedules;
    if (reservationFilter === 'required') filtered = schedules.filter(s => s.reservation.status === '예정');
    else if (reservationFilter === 'completed') filtered = schedules.filter(s => s.reservation.status === '완료');
    else if (reservationFilter === 'unnecessary') filtered = schedules.filter(s => s.reservation.status === '불필요');

    // Sort
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'date') {
        return a.date.localeCompare(b.date);
      } else if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      } else {
        return (a.city || '').localeCompare(b.city || '');
      }
    });

    return sorted;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-indigo-600">일정을 불러오는 중...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">프로젝트를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              ✈️ {project.project_name}
            </h1>
            <p className="text-gray-600 text-lg">
              {project.start_date} - {project.end_date}
            </p>
          </div>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
          >
            ← 프로젝트 목록
          </button>
        </div>

        {/* Stats Overview */}
        <StatsCard
          scheduleData={scheduleData}
          cities={project.cities}
          onCityClick={handleCityClick}
          onReservationFilterClick={handleReservationFilterClick}
        />

        {/* Cost KPI Dashboard */}
        <CostKpiDashboard schedules={Object.values(scheduleData).flat()} />

        {/* View Mode Toggle & Add Button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                viewMode === 'card'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              📋 카드 뷰
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 테이블 뷰
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              🗺️ 맵 뷰
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition-all transform hover:scale-105"
          >
            ➕ 새 일정 추가
          </button>
        </div>

        {/* City Tabs - Only show in card view */}
        {viewMode === 'card' && (
          <div ref={cardViewRef}>
            <CityTabs
              selectedCityId={selectedCityId}
              onCityChange={(cityId) => {
                setSelectedCityId(cityId);
                setReservationFilter('all');
              }}
              scheduleData={scheduleData}
              cities={project.cities}
            />

            {/* Filter and Sort Buttons */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-semibold text-gray-700 self-center mr-2">필터:</span>
                  <button
                    onClick={() => setReservationFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      reservationFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setReservationFilter('required')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      reservationFilter === 'required'
                        ? 'bg-gray-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    예정
                  </button>
                  <button
                    onClick={() => setReservationFilter('completed')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      reservationFilter === 'completed'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    완료
                  </button>
                  <button
                    onClick={() => setReservationFilter('unnecessary')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      reservationFilter === 'unnecessary'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    불필요
                  </button>
                </div>

                {/* Sort Buttons */}
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <span className="text-sm font-semibold text-gray-700 self-center mr-2">정렬:</span>
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      sortBy === 'date'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    날짜순
                  </button>
                  <button
                    onClick={() => setSortBy('category')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      sortBy === 'category'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    카테고리순
                  </button>
                  <button
                    onClick={() => setSortBy('city')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      sortBy === 'city'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    도시순
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content - Card View, Table View, or Map View */}
        {viewMode === 'card' ? (
          <ScheduleList
            schedules={getFilteredSchedules(scheduleData[selectedCityId] || [])}
            cityId={selectedCityId}
            cityName={getCityName(selectedCityId)}
            onUpdate={(updatedSchedules) => {
              setScheduleData({
                ...scheduleData,
                [selectedCityId]: updatedSchedules
              });
            }}
          />
        ) : viewMode === 'table' ? (
          <TableView
            schedules={Object.values(scheduleData).flat()}
            cities={project.cities}
            onUpdate={() => loadData()}
          />
        ) : (
          <MapView schedules={Object.values(scheduleData).flat()} />
        )}

        {/* Add Schedule Modal */}
        <AddScheduleModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          cities={project.cities}
          onScheduleAdded={() => loadData()}
          projectId={project.id}
        />
      </div>
    </main>
  );
}

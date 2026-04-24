import { CityName, ScheduleByCity } from '../types/schedule';

interface CityTabsProps {
  selectedCity: CityName;
  onCityChange: (city: CityName) => void;
  scheduleData: ScheduleByCity;
}

const cityEmojis: Record<CityName, string> = {
  '부다페스트': '🏛️',
  '빈': '🎻',
  '프라하': '🏰',
  '할슈타트': '⛰️',
};

export default function CityTabs({ selectedCity, onCityChange, scheduleData }: CityTabsProps) {
  const cities: CityName[] = ['부다페스트', '빈', '프라하', '할슈타트'];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        {cities.map(city => {
          const isActive = selectedCity === city;
          const scheduleCount = scheduleData[city]?.length || 0;

          return (
            <button
              key={city}
              onClick={() => onCityChange(city)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 shadow-md'
              }`}
            >
              <span className="mr-2">{cityEmojis[city]}</span>
              {city}
              <span className="ml-2 text-sm opacity-80">({scheduleCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

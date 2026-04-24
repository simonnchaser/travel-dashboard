import { ScheduleItem } from '../types/schedule';
import { City } from '../types/tripSettings';

interface CityTabsProps {
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  scheduleData: Record<string, ScheduleItem[]>;
  cities: City[];
}

const defaultEmojis = ['🏛️', '🎻', '🏰', '⛰️', '🌆', '🏙️', '🗼', '🌉'];

export default function CityTabs({ selectedCityId, onCityChange, scheduleData, cities }: CityTabsProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3">
        {cities.map((city, index) => {
          const isActive = selectedCityId === city.id;
          const scheduleCount = scheduleData[city.id]?.length || 0;
          const emoji = defaultEmojis[index % defaultEmojis.length];

          return (
            <button
              key={city.id}
              onClick={() => onCityChange(city.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 shadow-md'
              }`}
            >
              <span className="mr-2">{emoji}</span>
              {city.name}
              <span className="ml-2 text-sm opacity-80">({scheduleCount})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

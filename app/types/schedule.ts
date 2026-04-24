export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type ReservationStatus = '예정' | '완료' | '불필요';

export interface Reservation {
  required: boolean;
  completed: boolean;
  status: ReservationStatus;
}

export type ScheduleCategory = 'accommodation' | 'dining' | 'activity' | 'transport';

// Unified schedule item with all possible fields
export interface ScheduleItem {
  // Base fields (always present)
  id?: string;
  city?: string;
  city_id?: string; // New: city identifier from trip_settings
  date: string;
  day_of_week: string;
  time?: string;
  title: string;
  details: string;
  google_maps_url: string | null;
  coordinates: Coordinates | null;
  cost: string | null;
  currency?: string;
  unit: string | null;
  reservation: Reservation;
  reservation_link: string | null;
  notes?: string;
  photos?: string[];
  category: ScheduleCategory;

  // Accommodation fields
  address?: string;
  checkin_checkout?: string;
  duration?: string;

  // Dining fields
  restaurant_name?: string;
  menu?: string;
  reservation_time?: string;

  // Activity fields
  activity_duration?: string;
  entrance_fee?: string;
  operating_hours?: string;

  // Transport fields
  departure?: string;
  arrival?: string;
  transport_method?: string;
  travel_duration?: string;
  departure_google_maps_url?: string | null;
  arrival_google_maps_url?: string | null;
  departure_time?: string; // 출발 시간
  arrival_time?: string;   // 도착 시간

  // Legacy fields (for backward compatibility)
  transportation?: string;
  meals?: string;
}

export interface ScheduleByCity {
  부다페스트: ScheduleItem[];
  빈: ScheduleItem[];
  프라하: ScheduleItem[];
  할슈타트: ScheduleItem[];
  대한민국: ScheduleItem[];
  기타: ScheduleItem[];
}

export type CityName = '부다페스트' | '빈' | '프라하' | '할슈타트' | '대한민국' | 'Budapest' | 'Vienna' | 'Prague' | 'Hallstatt';

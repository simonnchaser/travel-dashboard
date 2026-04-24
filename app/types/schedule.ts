export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Reservation {
  required: boolean;
  completed: boolean;
  status: string;
}

export interface ScheduleItem {
  date: string;
  day_of_week: string;
  title: string;
  details: string;
  coordinates: Coordinates | null;
  google_maps_url: string | null;
  reservation: Reservation;
  reservation_link: string | null;
  duration: string | null;
  checkin_checkout: string | null;
  transportation: string | null;
  meals: string | null;
  cost: string | null;
  unit: string | null;
  photos?: string[];
  notes?: string;
}

export interface ScheduleByCity {
  부다페스트: ScheduleItem[];
  빈: ScheduleItem[];
  프라하: ScheduleItem[];
  할슈타트: ScheduleItem[];
  대한민국: ScheduleItem[];
  기타: ScheduleItem[];
}

export type CityName = '부다페스트' | '빈' | '프라하' | '할슈타트';

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface TripSettings {
  id?: string;
  trip_name: string;
  countries: string[];
  cities: City[];
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

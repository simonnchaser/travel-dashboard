export type BookingCategory =
  | 'flight'        // 항공권
  | 'accommodation' // 숙소
  | 'tour'          // 투어/액티비티
  | 'restaurant'    // 레스토랑
  | 'transportation' // 교통 (기차, 버스, 렌터카 등)
  | 'entertainment' // 공연/이벤트
  | 'other';        // 기타

export interface Booking {
  id?: string;
  trip_id?: string;
  category: BookingCategory;
  title: string;
  booking_number?: string;
  booking_url?: string;
  booking_date?: string; // 예약한 날짜
  start_date?: string;   // 예약 시작 날짜/시간
  end_date?: string;     // 예약 종료 날짜/시간 (숙소 등)
  location?: string;     // 장소/주소
  price?: number;
  currency?: string;     // 통화 (KRW, USD, EUR 등)
  notes?: string;
  file_name?: string;    // 첨부 파일명
  file_path?: string;    // 첨부 파일 경로
  file_type?: string;    // 파일 MIME 타입
  file_size?: number;    // 파일 크기
  created_at?: string;
  updated_at?: string;
}

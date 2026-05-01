# Technical Debt & Future Improvements

## 🔴 High Priority

### Database Schema Refactoring
**문제점:**
- `schedules` 테이블이 모든 카테고리의 필드를 평면적으로 포함하고 있음
- 카테고리별 전용 필드(투어의 `tour_guide`, `tour_spots` 등)가 스키마에 존재하지 않음
- 데이터베이스 정규화가 되어있지 않아 유지보수가 어려움

**현재 임시방편:**
- 투어 카테고리의 `tour_guide`, `tour_spots` 정보를 `details` 필드에 JSON으로 저장

**개선 방안 (예상 소요시간: 2-3시간):**

#### Option 1: JSONB 컬럼 추가 (추천)
```sql
ALTER TABLE schedules ADD COLUMN category_data JSONB;
```

**장점:**
- 기존 데이터 영향 없음
- 마이그레이션 간단함
- 카테고리별 필드를 유연하게 저장 가능
- 롤백 쉬움

**작업 내용:**
1. Supabase에서 `category_data` JSONB 컬럼 추가
2. `AddScheduleModal_v2.tsx` 수정: 카테고리별 데이터를 `category_data`에 저장
3. `ScheduleCard.tsx` 수정: `category_data`에서 데이터 읽기
4. 기존 평면 컬럼들은 deprecate 표시 후 점진적으로 제거

**예상 데이터 구조:**
```json
{
  "tour": {
    "tour_guide": "김투어 가이드 (010-1234-5678)",
    "tour_spots": [
      {
        "id": "spot-1",
        "name": "부다 성",
        "duration": "2시간",
        "details": "입장료 포함"
      }
    ]
  },
  "accommodation": {
    "checkin_checkout": "15:00 / 11:00",
    "duration": "2박 3일"
  }
}
```

#### Option 2: 테이블 분리 (정석이지만 시간 많이 소요)
```sql
CREATE TABLE schedule_tours (
  id uuid PRIMARY KEY,
  schedule_id uuid REFERENCES schedules(id),
  tour_guide text,
  tour_spots jsonb
);

CREATE TABLE schedule_accommodations (
  id uuid PRIMARY KEY,
  schedule_id uuid REFERENCES schedules(id),
  checkin_checkout text,
  duration text
);
-- ... 각 카테고리별 테이블
```

**장점:**
- 완전한 정규화
- 타입 안정성
- 명확한 스키마

**단점:**
- 마이그레이션 복잡
- 조인 쿼리 필요
- 개발 시간 증가 (예상 3-4시간)

---

## 🟡 Medium Priority

### MapView 에러 처리
**문제점:**
- 콘솔에 Google Maps 관련 에러들이 간헐적으로 발생
- `setMap: not an instance of Map` 에러

**개선 필요:**
- 맵 초기화 완료 후 마커/폴리라인 추가하도록 순서 보장
- null 체크 강화

---

## 🟢 Low Priority

### 코드 최적화
- 컴포넌트 리렌더링 최적화
- useMemo/useCallback 활용 검토

---

## ✅ Completed
- MapView 업데이트 이슈 수정 (useMemo 사용)
- 더블클릭 기능 추가 후 제거
- `meeting_location`, `meeting_time` 필드 제거 및 공통 필드 사용 통일

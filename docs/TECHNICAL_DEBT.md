# Technical Debt & Future Improvements

## 🔴 High Priority

### 1. Unify Schedule Add/Edit Forms
**문제점:**
- `AddScheduleModal_v2.tsx` (새 일정 추가)와 `ScheduleCard_v2.tsx` (일정 수정)가 별도로 구현되어 있음
- 중복 코드가 많고 유지보수 어려움
- UI/UX 일관성 부족
- 한쪽에서 기능 추가하면 다른 쪽도 수정해야 함

**현재 상태:**
- 새 일정 추가: `AddScheduleModal_v2.tsx` (모달 형태)
- 일정 수정: `ScheduleCard_v2.tsx` 내부 편집 모드 (카드 확장 형태)

**개선 방안 (예상 소요시간: 2-3시간):**

#### Option 1: 공통 폼 컴포넌트 생성 (추천)
```
app/components/
  ├── ScheduleFormModal.tsx        # 새로 생성: 통합 폼 모달
  ├── ScheduleFormFields.tsx       # 새로 생성: 재사용 가능한 폼 필드들
  ├── AddScheduleModal_v2.tsx      # 제거 또는 래퍼로 변경
  └── ScheduleCard_v2.tsx          # 편집 모드 제거, 모달 열기로 변경
```

**작업 내용:**
1. `ScheduleFormFields.tsx` 생성
   - 모든 카테고리별 입력 필드 컴포넌트화
   - Props: `formData`, `setFormData`, `category`, `cities`

2. `ScheduleFormModal.tsx` 생성
   - Add/Edit 모드 지원 (`mode: 'add' | 'edit'`)
   - `ScheduleFormFields` 사용
   - 저장 로직 통합

3. `AddScheduleModal_v2.tsx` → 래퍼로 변경
   ```tsx
   export default function AddScheduleModal(props) {
     return <ScheduleFormModal mode="add" {...props} />;
   }
   ```

4. `ScheduleCard_v2.tsx` 수정
   - 인라인 편집 모드 제거
   - "수정하기" 버튼 클릭 시 `ScheduleFormModal` 열기

**장점:**
- DRY 원칙 준수
- 일관된 UX
- 유지보수 용이
- 버그 감소

#### Option 2: 카드 내 편집을 모달로 통일
현재 AddScheduleModal 로직을 그대로 사용하되, 편집 시에도 모달 띄우기

**장점:**
- 구현 빠름 (1-2시간)
- 화면 공간 효율적

**단점:**
- 여전히 코드 중복

---

### 2. Database Schema Refactoring
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
- 투어 데이터를 details 필드에 JSON으로 저장 (임시방편)

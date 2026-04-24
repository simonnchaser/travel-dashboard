# 프오헝 여행 대시보드 ✈️

헝가리, 오스트리아, 체코 여행 일정 관리 웹 애플리케이션

## 주요 기능

- 📅 도시별 일정 관리 (부다페스트, 빈, 프라하, 할슈타트)
- ✅ 예약 상태 체크리스트
- 💰 비용 계산 및 통계
- 📍 구글맵 연동 (좌표 표시)
- 📝 메모 기능
- 📊 일정 통계 대시보드

## 로컬 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포

### 1. Vercel CLI 설치 (선택사항)

```bash
npm install -g vercel
```

### 2. Vercel에 배포

```bash
cd travel-dashboard
vercel
```

또는 Vercel 웹사이트에서:
1. [vercel.com](https://vercel.com) 접속
2. GitHub 연동 후 프로젝트 import
3. 자동 배포

## 데이터 업데이트

### 방법 1: JSON 직접 수정
`public/schedule.json` 파일을 직접 수정 후 배포

### 방법 2: 노션 CSV Export (추천)
1. 노션에서 "프오헝 스케줄" DB를 CSV로 export
2. 프로젝트 루트에 CSV 파일 저장
3. 파싱 스크립트 실행:
```bash
python3 ../parse_schedule.py
cp ../schedule_by_city.json public/schedule.json
```
4. Git commit & push → 자동 배포

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **배포**: Vercel
- **데이터**: JSON (향후 Notion API)

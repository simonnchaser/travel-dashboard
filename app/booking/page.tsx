'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingView from '../components/BookingView';

function BookingContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-xl text-red-600">프로젝트 ID가 필요합니다.</div>
      </div>
    );
  }

  return <BookingView projectId={projectId} />;
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
      <div className="text-xl">로딩 중...</div>
    </div>}>
      <BookingContent />
    </Suspense>
  );
}

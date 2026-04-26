'use client';

import { useSearchParams } from 'next/navigation';
import PackingListView from '../components/PackingListView';

export default function PackingPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">프로젝트 ID가 필요합니다.</div>
      </div>
    );
  }

  return <PackingListView projectId={projectId} />;
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  project_code: string;
  project_name: string;
  start_date: string;
  end_date: string;
  cities: any[];
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [projectCode, setProjectCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadProjects();
  }

  async function loadProjects() {
    try {
      // 내가 멤버인 프로젝트들 가져오기
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (memberError) throw memberError;

      const projectIds = memberData?.map(m => m.project_id) || [];

      if (projectIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // 프로젝트 정보 가져오기
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setLoading(false);
    }
  }

  async function joinProject() {
    if (!projectCode.trim()) {
      alert('프로젝트 코드를 입력해주세요!');
      return;
    }

    setJoining(true);
    try {
      // 프로젝트 코드로 프로젝트 찾기
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('project_code', projectCode.toUpperCase())
        .single();

      if (projectError || !project) {
        alert('존재하지 않는 프로젝트 코드입니다!');
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // 프로젝트에 멤버로 추가
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) {
        if (memberError.code === '23505') {
          alert('이미 참여 중인 프로젝트입니다!');
        } else {
          throw memberError;
        }
        return;
      }

      alert('프로젝트 참여 완료!');
      setShowJoinModal(false);
      setProjectCode('');
      loadProjects();
    } catch (error) {
      console.error('Failed to join project:', error);
      alert('프로젝트 참여 실패!');
    } finally {
      setJoining(false);
    }
  }

  async function deleteProject(projectId: string, projectName: string) {
    if (!confirm(`정말로 "${projectName}" 프로젝트를 삭제하시겠습니까?\n\n⚠️ 프로젝트의 모든 일정과 데이터가 삭제됩니다!`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      alert('프로젝트가 삭제되었습니다.');
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('프로젝트 삭제 실패!');
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-indigo-600">프로젝트를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-gray-800 mb-2">✈️ 내 여행 프로젝트</h1>
            <p className="text-gray-600 text-lg">함께 계획하고 함께 떠나요</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
          >
            로그아웃
          </button>
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg transition-all transform hover:scale-105"
          >
            ➕ 새 프로젝트 만들기
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg transition-all transform hover:scale-105"
          >
            🔗 프로젝트 참여하기
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id, project.project_name);
                  }}
                  className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                  title="프로젝트 삭제"
                >
                  🗑️
                </button>

                {/* Project Card Content - Clickable */}
                <div
                  onClick={() => router.push(`/dashboard?project=${project.id}`)}
                  className="cursor-pointer"
                >
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{project.project_name}</h3>
                    <p className="text-sm text-gray-500">
                      {project.start_date} ~ {project.end_date}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">프로젝트 코드</p>
                    <p className="text-lg font-mono font-bold text-indigo-600">{project.project_code}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.cities.slice(0, 3).map((city: any) => (
                      <span
                        key={city.id}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold"
                      >
                        {city.name}
                      </span>
                    ))}
                    {project.cities.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        +{project.cities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-xl text-gray-500 mb-6">아직 참여 중인 프로젝트가 없습니다</p>
            <p className="text-gray-400">새 프로젝트를 만들거나 친구의 프로젝트에 참여해보세요!</p>
          </div>
        )}

        {/* Join Project Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">프로젝트 참여하기</h2>
              <p className="text-gray-600 mb-6">친구에게 받은 프로젝트 코드를 입력하세요</p>

              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                placeholder="프로젝트 코드 (예: ABCD1234)"
                className="w-full p-4 border-2 border-gray-200 rounded-lg mb-6 text-center text-2xl font-mono font-bold tracking-wider focus:ring-2 focus:ring-green-500"
                maxLength={8}
              />

              <div className="flex gap-3">
                <button
                  onClick={joinProject}
                  disabled={joining}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {joining ? '참여 중...' : '참여하기'}
                </button>
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setProjectCode('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

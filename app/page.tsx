'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in, go to login
        router.push('/login');
      } else {
        // Logged in, go to projects page
        router.push('/projects');
      }
    } catch (err) {
      console.error('Failed to check auth:', err);
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">로그인 확인 중...</p>
      </div>
    </div>
  );
}

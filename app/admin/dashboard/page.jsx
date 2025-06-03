// /app/admin/dashboard/page.jsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase/clientApp'; // 경로 확인
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = auth.currentUser; // 직접 접근 시 초기에는 null일 수 있음

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/admin'); // 로그인 안되어 있으면 로그인 페이지로
      }
      // 추가적인 관리자 권한 확인 로직이 필요하다면 여기에 구현
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/admin'); // 로그아웃 후 로그인 페이지로
    } catch (error) {
      console.error("Logout error", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>관리자 대시보드</h1>
      {user ? <p>환영합니다, {user.email} 님!</p> : <p>사용자 정보를 불러오는 중...</p>}
      <p>이곳에 관리자 기능을 구현합니다.</p>
      <button 
        onClick={handleLogout} 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#e53e3e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
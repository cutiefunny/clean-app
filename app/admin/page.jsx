// /app/admin/page.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Next.js 13+ App Router의 useRouter
import { auth } from '../../lib/firebase/clientApp'; // Firebase auth 객체 경로 확인 필요
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // 로그인 시도 중 로딩 상태
  const router = useRouter();

  // 이미 로그인된 사용자인 경우 대시보드로 리디렉션
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 관리자 여부 확인 로직 추가 가능 (예: Firestore에서 관리자 목록 확인)
        // 여기서는 단순 로그인이면 대시보드로 이동
        router.replace('/admin/dashboard'); // 로그인 되어있으면 대시보드로
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시 onAuthStateChanged가 감지하여 위 useEffect에서 리디렉션 처리
      // 또는 여기서 직접 router.push('/admin/dashboard'); 해도 무방
      console.log("Admin logged in successfully");
      // router.push('/admin/dashboard'); // 여기서 직접 리디렉션도 가능
    } catch (err) {
      console.error("Admin login error:", err.code, err.message);
      if (err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' || // 오래된 SDK 또는 특정 조건에서 발생 가능성
          err.code === 'auth/wrong-password') { // 오래된 SDK 또는 특정 조건에서 발생 가능성
        setError('이메일 또는 비밀번호가 잘못되었습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 첨부 이미지와 유사한 스타일 적용 (Tailwind CSS 또는 일반 CSS로 대체 가능)
  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f7f7f7', // 이미지 배경이 흰색이므로 유사한 밝은 회색
  };

  const formContainerStyle = {
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    width: '400px', // 너비 고정
    textAlign: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '30px',
  };

  const inputGroupStyle = {
    marginBottom: '20px',
    textAlign: 'left',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    marginBottom: '8px',
    color: '#333',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    boxSizing: 'border-box', // padding과 border가 너비에 포함되도록
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#5a67d8', // 예시 색상 (이미지 버튼과 유사하게)
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    opacity: loading ? 0.7 : 1,
  };

  const errorStyle = {
    color: 'red',
    marginBottom: '15px',
    fontSize: '14px',
  };

   const findPasswordStyle = {
    display: 'block', // input 그룹과의 간격을 위해
    marginTop: '15px', // 비밀번호 입력창과의 간격
    marginBottom: '25px', // 로그인 버튼과의 간격
    fontSize: '14px',
    color: '#555',
    textDecoration: 'none',
  };


  return (
    <div style={pageStyle}>
      <div style={formContainerStyle}>
        <h1 style={titleStyle}>로그인</h1>
        <form onSubmit={handleLogin}>
          <div style={inputGroupStyle}>
            <label htmlFor="email" style={labelStyle}>이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력해주세요."
              style={inputStyle}
              required
            />
          </div>
          <div style={inputGroupStyle}>
            <label htmlFor="password" style={labelStyle}>비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력해주세요."
              style={inputStyle}
              required
            />
          </div>
          {/* 이미지에는 없지만, 일반적으로 로그인 폼 하단에 위치 */}
          <a href="#" style={findPasswordStyle} onClick={(e) => { e.preventDefault(); alert('비밀번호 찾기 기능은 준비 중입니다.'); }}>
            비밀번호 찾기
          </a>
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
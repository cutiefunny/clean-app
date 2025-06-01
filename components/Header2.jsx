// components/Header2.jsx (반응형 로직 통합)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // onBack을 위해 필요할 수 있음
import Header2PC from '@/components/Header2PC'; // PC용 헤더 컴포넌트 임포트
import styles from './Header2.module.css'; // Header2의 모바일 UI를 위한 스타일

const DESKTOP_BREAKPOINT = 500; // 개발자님께서 설정하신 기준점

export default function Header2(props) { // 페이지로부터 title, onBack 등 공통 props를 받음
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter(); // onBack 기본 동작을 위해 필요 시 사용

  useEffect(() => {
    // window 객체가 정의된 클라이언트 환경에서만 실행
    if (typeof window !== 'undefined') {
      const checkScreenSize = () => {
        setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
      };

      checkScreenSize(); // 초기 실행
      window.addEventListener('resize', checkScreenSize);

      return () => window.removeEventListener('resize', checkScreenSize); // 클린업
    }
  }, []);

  // onBack prop이 없을 경우 기본 뒤로가기 동작 제공 (선택 사항)
  const handleBackAction = props.onBack ? props.onBack : () => router.back();

  if (isDesktop) {
    return <Header2PC {...props} />; // title, onBack 등 Header가 필요한 props가 전달됨
  } else {
    // 모바일 환경일 경우, Header2 자체의 모바일 UI를 렌더링합니다.
    // props에서 title과 onBack을 사용합니다.
    return (
      <header className={styles.mobileHeaderContainer}> {/* CSS 모듈 클래스 사용 */}
        {/* 뒤로가기 버튼은 onBack prop이 있을 때만 표시하거나, 항상 표시하고 싶다면 조건 제거 */}
        {props.onBack && (
          <button onClick={handleBackAction} className={styles.backButton}>
            ‹
          </button>
        )}
        {/* title prop이 있다면 h1 태그로 제목 표시 */}
        {props.title && <h1 className={styles.title}>{props.title}</h1>}
        {/* 모바일 헤더에서 제목 중앙 정렬 등을 위한 플레이스홀더 (필요시) */}
        {props.onBack && !props.title && <div className={styles.placeholderEnd}></div>}
      </header>
    );
  }
}
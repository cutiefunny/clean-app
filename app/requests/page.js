// app/requests/page.js
'use client';

import React, { useState, useEffect } from 'react'; // useState, useEffect 추가
import { useRouter } from 'next/navigation'; // useRouter 추가
import Header2 from '@/components/Header2';
import RequestCard from '@/components/RequestCard';
import listStyles from './RequestListPage.module.css';

// 목업 데이터 (기존과 동일)
const mockRequests = [
  {
    id: 'req1',
    serviceType: '입주청소',
    usageDate: '2024.04.15',
    preferredTime: '오후',
    address: '서울시 강남구 강남대로 123길 12',
    buildingType: '오피스텔',
    area: '18평',
    spaceInfo: '방1, 화장실1',
    name: '홍길동',
    phoneNumber: '010-1234-5678',
    inquiry: '지금 방에 모든짐은 그대로 입니다.\n그리고 깨끗하게 부탁드릴게요.',
    reviewwritten: false
  },
  {
    id: 'req2',
    serviceType: '이사청소',
    usageDate: '2024.05.20',
    preferredTime: '오전',
    address: '서울시 마포구 월드컵북로 456길 34',
    buildingType: '아파트',
    area: '32평',
    spaceInfo: '방3, 화장실2',
    name: '김영희',
    phoneNumber: '010-8765-4321',
    inquiry: '이사 나가는 집 청소입니다.\n베란다 확장이 되어 있습니다.\n꼼꼼하게 부탁드립니다.',
    reviewwritten: true
  },
  {
    id: 'req3',
    serviceType: '사무실청소',
    usageDate: '2024.06.01',
    preferredTime: '주말 오후',
    address: '서울시 종로구 세종대로 789길 56',
    buildingType: '상가건물',
    area: '50평',
    spaceInfo: '사무공간1, 회의실1, 탕비실1',
    name: '박철수',
    phoneNumber: '010-9988-7766',
    inquiry: '주말에만 청소 가능합니다.\n쓰레기통 비우기 및 바닥 청소 위주로 부탁드립니다.',
    reviewwritten: false
  }
];

const DESKTOP_BREAKPOINT = 550; // 데스크톱으로 간주할 너비 (예: 550px)

const RequestListPage = () => {
  const router = useRouter(); // useRouter 훅 사용
  const [isDesktop, setIsDesktop] = useState(false); // 데스크톱 여부 상태

  // 화면 크기 감지 로직
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    checkScreenSize(); // 초기 실행
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize); // 클린업
  }, []);

  const handleBack = () => {
    router.back(); // 뒤로가기 기능
  };

  // 현재 화면 크기에 따라 적절한 헤더 컴포넌트 선택
  const headerTitle = "신청내역"; // 헤더 제목 (기존 "리뷰내역"에서 변경 권장)

  return (
    // 페이지 전체를 감싸는 div에 배경색 등을 적용하려면 여기에 스타일 적용
    <div className={listStyles.pageWrapper}> {/* 예: 전체 페이지 배경을 위한 wrapper */}
      <Header2 title={headerTitle} onBack={handleBack} />
      {isDesktop && <div className={listStyles.desktopTitle}>내 신청내역</div>}
      <div className={listStyles.listContainer}>
        {mockRequests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
};

export default RequestListPage;
// app/requests/page.js
'use client';

import Header2 from '@/components/Header2'; // 기존 헤더 컴포넌트
import RequestCard from '@/components/RequestCard'; // 새로 만든 RequestCard 컴포넌트 import
import listStyles from './RequestListPage.module.css'; // 목록 페이지용 CSS 모듈

// 상세 카드에 필요한 모든 필드를 포함하는 목업 데이터
const mockRequests = [
  {
    id: 'req1',
    serviceType: '입주청소',
    usageDate: '2024.04.15',
    preferredTime: '오후', // 상세 페이지에는 있지만 카드에는 표시 안 함 (필요시 추가)
    address: '서울시 강남구 강남대로 123길 12', // 상세 페이지용
    buildingType: '오피스텔',
    area: '18평',
    spaceInfo: '방1, 화장실1',
    name: '홍길동', // 상세 페이지용
    phoneNumber: '010-1234-5678', // 상세 페이지용
    inquiry: '지금 방에 모든짐은 그대로 입니다.\n그리고 깨끗하게 부탁드릴게요.', // 상세 페이지용
    reviewwritten: false // 후기 작성 여부 (카드에서 사용)
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


const RequestListPage = () => {
  return (
    <>
      {/* Header2의 title prop은 "리뷰내역"에서 "신청내역" 등으로 변경하시는 것이 의미상 맞을 수 있습니다. */}
      <Header2 title="리뷰내역" onBack={() => window.history.back()} />
      <div className={listStyles.listContainer}>
        {mockRequests.map((request) => (
          // 새로운 RequestCard 컴포넌트 사용
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </>
  );
};

export default RequestListPage;
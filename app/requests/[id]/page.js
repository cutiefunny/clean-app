// app/requests/[id]/page.js
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation'; // useParams 훅 사용
import { useEffect, useState } from 'react';
import Header2 from '@/components/Header2'; // 헤더 컴포넌트
import detailStyles from './RequestDetailPage.module.css'; // 상세 페이지용 새 CSS 모듈

// 위에서 정의한 mockRequests 사용 또는 import
const mockRequests = [
  { id: 'req1', serviceType: '입주청소', usageDate: '2024.04.15', preferredTime: '오후', address: '서울시 강남구 강남대로 123길 12', buildingType: '오피스텔', area: '18평', spaceInfo: '방1, 화장실1', name: '홍길동', phoneNumber: '010-1234-5678', inquiry: '지금 방에 모든짐은 그대로 입니다.\n그리고 깨끗하게 부탁드릴게요.' },
  { id: 'req2', serviceType: '이사청소', usageDate: '2024.05.20', preferredTime: '오전', address: '서울시 마포구 월드컵북로 456길 34', buildingType: '아파트', area: '32평', spaceInfo: '방3, 화장실2', name: '김영희', phoneNumber: '010-8765-4321', inquiry: '이사 나가는 집 청소입니다.\n베란다 확장이 되어 있습니다.\n꼼꼼하게 부탁드립니다.' },
  { id: 'req3', serviceType: '사무실청소', usageDate: '2024.06.01', preferredTime: '주말 오후', address: '서울시 종로구 세종대로 789길 56', buildingType: '상가건물', area: '50평', spaceInfo: '사무공간1, 회의실1, 탕비실1', name: '박철수', phoneNumber: '010-9988-7766', inquiry: '주말에만 청소 가능합니다.\n쓰레기통 비우기 및 바닥 청소 위주로 부탁드립니다.' },
];


async function getRequestById(id) {
  // 실제로는 API 호출 또는 DB 조회
  await new Promise(resolve => setTimeout(resolve, 100)); // 로딩 시뮬레이션
  return mockRequests.find(req => req.id === id);
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params ? params.id : null;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      const fetchRequestData = async () => {
        setLoading(true);
        const requestData = await getRequestById(requestId);
        setRequest(requestData);
        setLoading(false);
      };
      fetchRequestData();
    } else {
      setLoading(false);
    }
  }, [requestId]);

  if (loading) {
    return (
      <div className={detailStyles.pageContainer}>
        <Header2 title="로딩 중..." onBack={() => window.history.back()} />
        <main className={detailStyles.loadingText}>신청내역을 불러오는 중입니다...</main>
      </div>
    );
  }

  if (!request) {
    return (
      <div className={detailStyles.pageContainer}>
        <Header2 title="오류" onBack={() => window.history.back()} />
        <main className={detailStyles.errorText}>
          신청내역을 찾을 수 없습니다. (ID: {requestId || "알 수 없음"})<br />
          <Link href="/requests">목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }

  // 상세 정보 항목을 배열로 만들어 쉽게 렌더링
  const detailItems = [
    { label: '이용일', value: request.usageDate },
    { label: '희망시간대', value: request.preferredTime },
    { label: '주소', value: request.address },
    { label: '건물형태', value: request.buildingType },
    { label: '평수', value: request.area },
    { label: '공간정보', value: request.spaceInfo },
    { label: '이름', value: request.name },
    { label: '휴대폰번호', value: request.phoneNumber },
    { label: '청소관련 문의', value: request.inquiry, isMultiline: true }, // 여러 줄 표시를 위한 플래그
  ];

  return (
    <div className={detailStyles.pageContainer}>
      <Header2 title="내역상세" onBack={() => window.history.back()} />
      <main className={detailStyles.detailContent}>
        <h2 className={detailStyles.serviceTitle}>{request.serviceType}</h2>
        <div className={detailStyles.infoTable}>
          {detailItems.map((item) => (
            <div key={item.label} className={detailStyles.infoRow}>
              <span className={detailStyles.infoLabel}>{item.label}</span>
              <span className={`${detailStyles.infoValue} ${item.isMultiline ? detailStyles.multiline : ''}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
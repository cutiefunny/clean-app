// /app/requests/[id]/page.js (Firestore 연동)
'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Firestore 모듈 및 db 객체 임포트
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

import Header2 from '@/components/Header2';
import detailStyles from './RequestDetailPage.module.css';

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params?.id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError('유효하지 않은 접근입니다.');
      return;
    }

    const fetchRequestData = async () => {
      setLoading(true);
      setError('');
      
      // 1. 세션 스토리지에서 본인인증 정보 확인
      const storedAuth = sessionStorage.getItem('identityVerifiedUser');
      if (!storedAuth) {
        alert('본인인증이 필요합니다. 메인 페이지로 이동합니다.');
        router.replace('/');
        return;
      }

      try {
        const authData = JSON.parse(storedAuth);
        
        // 2. Firestore에서 해당 ID의 문서 가져오기
        const docRef = doc(db, 'requests', requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const requestData = docSnap.data();

          // 3. (보안) 가져온 데이터가 현재 인증된 사용자의 것인지 확인
          if (requestData.applicantName !== authData.name || requestData.applicantContact !== authData.phoneNumber) {
            setError('이 신청내역을 조회할 권한이 없습니다.');
          } else {
            // 4. 데이터 포맷팅 후 상태에 저장
            setRequest({
              id: docSnap.id,
              serviceType: requestData.field || '정보 없음', // 필드명 확인 필요
              usageDate: requestData.usageDate?.toDate ? requestData.usageDate.toDate().toLocaleDateString('ko-KR') : '날짜 정보 없음',
              preferredTime: requestData.requestTimeSlot || '정보 없음',
              address: requestData.address || '정보 없음',
              buildingType: requestData.buildingType || '정보 없음',
              area: requestData.areaSize ? `${requestData.areaSize}평` : '정보 없음',
              spaceInfo: requestData.spaceInfo || '정보 없음',
              name: requestData.applicantName,
              phoneNumber: requestData.applicantContact,
              inquiry: requestData.inquiryNotes || '문의 내용 없음',
            });
          }
        } else {
          setError('해당 신청내역을 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error("Error fetching request detail:", err);
        setError('신청내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestData();
  }, [requestId, router]);

  if (loading) {
    return (
      <div className={detailStyles.pageContainer}>
        <Header2 title="로딩 중..." onBack={() => router.back()} />
        <main className={detailStyles.loadingText}>신청내역을 불러오는 중입니다...</main>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className={detailStyles.pageContainer}>
        <Header2 title="오류" onBack={() => router.back()} />
        <main className={detailStyles.errorText}>
          <p>{error || '신청내역을 찾을 수 없습니다.'}</p>
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
    { label: '청소관련 문의', value: request.inquiry, isMultiline: true },
  ];

  return (
    <div className={detailStyles.pageContainer}>
      <Header2 title="내역상세" onBack={() => router.back()} />
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

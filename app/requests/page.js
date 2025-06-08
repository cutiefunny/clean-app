// /app/requests/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Firestore 모듈 및 db 객체 임포트
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

import Header2 from '@/components/Header2';
import RequestCard from '@/components/RequestCard';
import listStyles from './RequestListPage.module.css';

const DESKTOP_BREAKPOINT = 550;

const RequestListPage = () => {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  // Firestore 데이터 및 상태 관리
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 화면 크기 감지 로직
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Firestore에서 신청 내역을 가져오는 로직
  useEffect(() => {
    const fetchRequests = async () => {
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
        const { name, phoneNumber } = authData;

        if (!name || !phoneNumber) {
          throw new Error('인증 정보가 올바르지 않습니다.');
        }

        // 2. Firestore에서 일치하는 데이터 쿼리
        const requestsRef = collection(db, 'requests');
        const q = query(
          requestsRef,
          where('applicantName', '==', name),
          where('applicantContact', '==', phoneNumber.replace(/-/g, '')),
          orderBy('requestDate', 'desc') // 신청일 최신순으로 정렬
        );
        
        const querySnapshot = await getDocs(q);
        
        const fetchedRequests = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Firestore Timestamp 필드를 JS Date 객체로 변환
            return {
                id: doc.id,
                ...data,
                // [수정] .toDate()를 호출하여 JS Date 객체로 변환 후 toLocaleDateString 실행
                usageDate: data.usageDate?.toDate ? data.usageDate.toDate().toLocaleDateString('ko-KR') : '날짜 정보 없음',
                requestDate: data.requestDate?.toDate ? data.requestDate.toDate().toLocaleDateString('ko-KR') : '날짜 정보 없음',
            };
        });
        
        setRequests(fetchedRequests);

      } catch (err) {
        console.error("Error fetching requests: ", err);
        setError("신청 내역을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router]); // router를 의존성 배열에 추가

  const handleBack = () => {
    router.back();
  };

  const headerTitle = "신청내역";

  // 로딩, 에러, 데이터 유무에 따른 조건부 렌더링 함수
  const renderContent = () => {
    if (loading) {
      return <p className={listStyles.infoText}>신청 내역을 불러오는 중...</p>;
    }
    if (error) {
      return <p className={listStyles.errorText}>{error}</p>;
    }
    if (requests.length === 0) {
      return <p className={listStyles.infoText}>신청 내역이 없습니다.</p>;
    }
    return requests.map((request) => (
      <RequestCard key={request.id} request={request} />
    ));
  };

  return (
    <div className={listStyles.pageWrapper}>
      <Header2 title={headerTitle} onBack={handleBack} />
      {isDesktop && <div className={listStyles.desktopTitle}>내 신청내역</div>}
      <div className={listStyles.listContainer}>
        {renderContent()}
      </div>
    </div>
  );
};

export default RequestListPage;

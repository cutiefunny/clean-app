// /app/requests/page.js (로직 개선)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';

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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showAlert } = useModal();

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
      
      const storedAuth = sessionStorage.getItem('identityVerifiedUser');
      if (!storedAuth) {
        showAlert('본인인증이 필요합니다. 메인 페이지로 이동합니다.');
        router.replace('/');
        return;
      }

      try {
        const authData = JSON.parse(storedAuth);
        const { name, phoneNumber } = authData;

        if (!name || !phoneNumber) {
          throw new Error('인증 정보가 올바르지 않습니다.');
        }

        const requestsRef = collection(db, 'requests');
        const q = query(
          requestsRef,
          where('applicantName', '==', name),
          where('applicantContact', '==', phoneNumber.replace(/-/g, '')),
          orderBy('requestDate', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        // 오늘 날짜 (시간은 제외하고 날짜만 비교하기 위함)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const fetchedRequests = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const usageDate = data.requestDate?.toDate ? data.requestDate.toDate() : null;

            // --- 후기 작성 가능 여부 판단 로직 ---
            // 1. 이용일이 존재하며 (`usageDate`)
            // 2. 이용일이 오늘보다 이전일 경우에만 `true`가 됩니다.
            const canWriteReview = usageDate <= today;

            // RequestCard에 필요한 props에 맞게 데이터 매핑 및 추가
            return {
                id: doc.id,
                serviceType: data.field,
                usageDate: usageDate ? usageDate.toLocaleDateString('ko-KR') : '날짜 정보 없음',
                preferredTime: data.requestTimeSlot,
                address: data.address,
                buildingType: data.buildingType,
                area: data.areaSize ? `${data.areaSize}평` : '정보 없음',
                spaceInfo: data.spaceInfo,
                name: data.applicantName,
                phoneNumber: data.applicantContact,
                inquiry: data.inquiryNotes,
                reviewWritten: data.reviewWritten,
                canWriteReview: canWriteReview
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
  }, [router, showAlert]);

  const handleBack = () => {
    router.back();
  };

  const headerTitle = "신청내역";

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
    // 가공된 request 객체를 RequestCard에 그대로 전달합니다.
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

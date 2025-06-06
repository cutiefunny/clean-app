// /app/admin/requests/sent/[id]/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp'; // Firebase 경로
import styles from '../../../board.module.css'; // 공통 CSS Module (5단계 상위)

const COLLECTION_NAME = "requests"; // Firestore 컬렉션 이름

export default function SentRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id;

  const [requestDetail, setRequestDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequestDetail = useCallback(async () => {
    if (!requestId) {
      setError("잘못된 접근입니다. 신청 ID가 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, COLLECTION_NAME, requestId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setRequestDetail({
          id: docSnap.id,
          ...data,
          // Firestore Timestamp를 JavaScript Date 객체로 변환
          requestDate: data.requestDate?.toDate ? data.requestDate.toDate() : null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
        });
      } else {
        setError("해당 신청 내역을 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching request detail: ", err);
      setError(`신청 내역을 불러오는 중 오류 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  const handleGoToList = () => {
    router.push('/admin/requests/sent'); // "전송" 목록 페이지로 이동
  };

  const formatDate = (date, includeTime = false) => {
    if (!date) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }
    try {
      return new Date(date).toLocaleDateString('ko-KR', options).replace(/\. /g, '.').replace(/\.$/, '');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return <div className={styles.pageContainer}><p className={styles.loadingText}>신청 내역을 불러오는 중...</p></div>;
  }
  if (error) {
    return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  }
  if (!requestDetail) {
    return <div className={styles.pageContainer}><p className={styles.emptyText}>신청 내역 정보가 없습니다.</p></div>;
  }

  // 이미지 제목은 '리뷰 상세 보기'이지만, 내용에 맞춰 '청소신청 상세 보기'로 수정
  return (
    <div className={styles.detailPageContainer}>
      <h1 className={styles.pageTitle}>청소신청 상세 보기</h1>

      <div className={styles.detailGrid}>
        <div className={styles.detailLabel}>희망서비스</div>
        <div className={styles.detailValue}>{requestDetail.field || '정보 없음'}</div>

        <div className={styles.detailLabel}>희망일</div>
        <div className={styles.detailValue}>{formatDate(requestDetail.requestDate)}</div>

        <div className={styles.detailLabel}>희망시간대</div>
        <div className={styles.detailValue}>{requestDetail.requestTimeSlot || '정보 없음'}</div>

        <div className={styles.detailLabel}>주소</div>
        <div className={styles.detailValue}>{requestDetail.address || '정보 없음'}</div>

        <div className={styles.detailLabel}>건물형태</div>
        <div className={styles.detailValue}>{requestDetail.buildingType || '정보 없음'}</div>

        <div className={styles.detailLabel}>평수</div>
        <div className={styles.detailValue}>{requestDetail.areaSize ? `${requestDetail.areaSize}평` : '정보 없음'}</div>

        <div className={styles.detailLabel}>공간정보</div>
        <div className={styles.detailValue}>{requestDetail.spaceInfo || '정보 없음'}</div>
        
        <div className={styles.detailLabel}>이름</div>
        <div className={styles.detailValue}>{requestDetail.applicantName || '정보 없음'}</div>

        <div className={styles.detailLabel}>휴대폰번호</div>
        <div className={styles.detailValue}>{requestDetail.applicantContact || '정보 없음'}</div>

        <div className={styles.detailLabel} style={{alignSelf: 'flex-start'}}>청소관련 문의</div>
        <div className={styles.detailValue} style={{whiteSpace: 'pre-wrap'}}>{requestDetail.inquiryNotes || '내용 없음'}</div>
        
        <div className={styles.detailLabel}>상태</div>
        <div className={styles.detailValue} style={{color: '#28a745', fontWeight: 'bold'}}>
            {requestDetail.status || '정보 없음'}
        </div>

        {/* '적용매장' 필드 추가 */}
        <div className={styles.detailLabel}>적용매장</div>
        <div className={`${styles.detailValue} ${styles.tagsContainer}`}>
          {requestDetail.sentToCompanies && requestDetail.sentToCompanies.length > 0 ? (
            requestDetail.sentToCompanies.map((company, index) => (
              <span key={index} className={styles.tagPrimary}>{company.name || company}</span>
            ))
          ) : (
            '정보 없음'
          )}
        </div>
      </div>

      <div className={styles.buttonContainer} style={{ justifyContent: 'flex-end', marginTop: '30px' }}>
        <button onClick={handleGoToList} className={styles.button}>
          목록
        </button>
      </div>
    </div>
  );
}
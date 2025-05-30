// app/reviews/page.js
'use client';

import React, { useState, useEffect } from 'react';
import Header2 from '@/components/Header2'; // Header2 컴포넌트 경로
import ReviewDisplayCard from '@/components/ReviewDisplayCard'; // 방금 만든 리뷰 카드
import styles from './ReviewListPage.module.css';
import { useRouter } from 'next/navigation';

// 목업 데이터 (실제로는 API나 Firestore에서 가져옵니다)
const mockReviewListData = [
  { id: 'review1', requestId: 'req1', authorName: '홍길동', serviceType: '오피스텔', area: '9평', rating: 4.9, usageDate: '2023.03.25', text: '정말 더러웠어요. 제가 청소할 엄두가 도저히 나지 않아 맡겼는데 진작 맡길껄 그랬어요. 깨끗해요', imageUrls: ['/images/sample/living-room-clean.jpg', '/images/sample/bathroom-clean.jpg', '/images/sample/kitchen-clean.jpg', '/images/sample/window-clean.jpg', '/images/sample/bedroom-clean.jpg', '/images/sample/balcony-clean.jpg'], createdAt: '2024-05-30T10:00:00Z' },
  { id: 'review2', requestId: 'req2', authorName: '김영희', serviceType: '아파트', area: '32평', rating: 5.0, usageDate: '2023.04.10', text: '꼼꼼하게 잘해주셔서 새집처럼 변했어요! 감사합니다. 다음에도 꼭 이용할게요. 사진은 청소 전후 비교입니다.', imageUrls: ['/images/sample/apartment-living.jpg', '/images/sample/apartment-kitchen.jpg'], createdAt: '2024-05-28T14:30:00Z' },
  { id: 'review3', requestId: 'req3', authorName: '박철수', serviceType: '빌라', area: '20평', rating: 4.5, usageDate: '2023.05.01', text: '빠른 매칭과 친절한 상담원분 덕분에 좋았습니다. 청소 상태도 만족합니다. 사진 한 장 첨부해요!', imageUrls: ['/images/sample/villa-room.jpg'], createdAt: '2024-05-25T18:00:00Z' },
];


export default function ReviewListPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest', 'rating_high', 'rating_low' 등

  // 데이터 패칭 시뮬레이션
  useEffect(() => {
    // TODO: 실제 API 호출로 대체
    // 정렬 로직도 여기서 또는 API 호출 시 적용
    let sortedReviews = [...mockReviewListData];
    if (sortOrder === 'latest') {
      sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    // 다른 정렬 조건 추가 가능

    setReviews(sortedReviews);
    setLoading(false);
  }, [sortOrder]);

  const handleSortChange = (e) => {
    // 실제로는 드롭다운 UI와 연결
    // setSortOrder(e.target.value);
    alert(`정렬 기준 변경: ${sortOrder === 'latest' ? '오래된순 (임시)' : '최신순 (임시)'}`);
    setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest'); // 임시 토글
  };


  if (loading) {
    return (
        <div className={styles.pageContainer}>
            <Header2 title="리뷰내역" onBack={() => router.back()} />
            <p className={styles.loadingText}>리뷰를 불러오는 중입니다...</p>
        </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header2 title="리뷰내역" onBack={() => router.back()} />
      <div className={styles.actionBar}>
        {/* 실제로는 드롭다운 컴포넌트 사용 */}
        <button onClick={handleSortChange} className={styles.sortButton}>
          {sortOrder === 'latest' ? '최신순' : '오래된순'} ▼
        </button>
      </div>
      <main className={styles.listContentArea}>
        {reviews.length === 0 ? (
          <p className={styles.noReviewsText}>아직 등록된 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <ReviewDisplayCard key={review.id} review={review} />
          ))
        )}
      </main>
    </div>
  );
}
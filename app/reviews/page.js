// /app/reviews/page.js (Firestore 연동)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header2 from '@/components/Header2';
import ReviewDisplayCard from '@/components/ReviewDisplayCard';
import ImageLightbox from '@/components/ImageLightbox';
import styles from './ReviewListPage.module.css';

// Firestore 모듈 및 db 객체 임포트
import { collection, getDocs, query, orderBy, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export default function ReviewListPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' 또는 'oldest'

  const [lightboxImage, setLightboxImage] = useState(null);
  // [수정] 라이트박스 상태를 객체로 관리
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    imageUrls: [],
    startIndex: 0,
  });
  
  useEffect(() => {
    const fetchReviewsData = async () => {
        setLoading(true);
        try {
            // 1. 리뷰 목록을 정렬 순서에 따라 가져옵니다.
            const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', sortOrder === 'latest' ? 'desc' : 'asc'));
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (reviewsData.length === 0) {
                setReviews([]);
                setLoading(false);
                return;
            }

            // 2. 리뷰에서 모든 고유한 requestId를 추출합니다.
            const requestIds = [...new Set(reviewsData.map(r => r.requestId).filter(Boolean))];

            let requestsMap = new Map();
            // 3. requestId가 있는 경우, 해당하는 신청 내역 정보를 한 번에 가져옵니다.
            if (requestIds.length > 0) {
                // Firestore 'in' 쿼리는 최대 30개의 요소를 처리할 수 있습니다.
                // 더 많은 요청을 처리해야 할 경우, 여러 번으로 나누어 요청해야 합니다.
                const requestsQuery = query(collection(db, 'requests'), where(documentId(), 'in', requestIds));
                const requestsSnapshot = await getDocs(requestsQuery);
                requestsSnapshot.forEach(doc => {
                    requestsMap.set(doc.id, doc.data());
                });
            }
            
            // 4. 리뷰 데이터와 신청 내역 데이터를 조합합니다.
            const combinedData = reviewsData.map(review => {
                const requestData = requestsMap.get(review.requestId) || {};
                return {
                    id: review.id,
                    requestId: review.requestId,
                    authorName: review.userName,
                    serviceType: requestData.buildingType || '정보 없음',
                    area: requestData.areaSize ? `${requestData.areaSize}평` : '정보 없음',
                    rating: review.rating,
                    usageDate: requestData.requestDate?.toDate().toLocaleDateString('ko-KR') || '정보 없음',
                    text: review.content,
                    imageUrls: review.imageUrls || [],
                    createdAt: review.createdAt?.toDate().toISOString() || new Date().toISOString()
                };
            });
            
            setReviews(combinedData);

        } catch (error) {
            console.error("Error fetching reviews:", error);
            // 필요하다면 UI에 에러 상태를 표시할 수 있습니다.
        } finally {
            setLoading(false);
        }
    };
    
    fetchReviewsData();
  }, [sortOrder]); // 정렬 순서가 변경될 때마다 데이터를 다시 가져옵니다.

  const handleSortChange = () => {
    setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest');
  };

  const openLightbox = (imageUrls, clickedIndex) => {
    // imageUrls 배열에서 유효한(비어있지 않은 문자열) URL만 필터링
    const validImageUrls = imageUrls.filter(url => url && typeof url === 'string');

    // 유효한 이미지가 하나도 없으면 라이트박스를 열지 않음
    if (validImageUrls.length === 0) return;

    // 클릭된 이미지가 필터링된 새 배열에서 몇 번째 인덱스인지 다시 계산
    const originalUrl = imageUrls[clickedIndex];
    const newIndex = validImageUrls.indexOf(originalUrl);

    setLightboxState({
      isOpen: true,
      imageUrls: validImageUrls,
      startIndex: newIndex >= 0 ? newIndex : 0, // 혹시 못찾으면 0번 인덱스
    });
  };

  const closeLightbox = () => {
    setLightboxState({
      isOpen: false,
      imageUrls: [],
      startIndex: 0,
    });
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
        <button onClick={handleSortChange} className={styles.sortButton}>
          {sortOrder === 'latest' ? '최신순' : '오래된순'} ▼
        </button>
      </div>
      <main className={styles.listContentArea}>
        {reviews.length === 0 ? (
          <p className={styles.noReviewsText}>아직 등록된 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <ReviewDisplayCard
              key={review.id}
              review={review}
              // [수정] onImageClick이 호출될 때, 리뷰의 전체 이미지와 클릭된 이미지의 인덱스를 전달합니다.
              // 이 로직이 작동하려면 ReviewDisplayCard 내부에서 이미지 클릭 시 index를 넘겨주도록 수정해야 합니다.
              onImageClick={(clickedIndex) => openLightbox(review.imageUrls, clickedIndex)}
            />
          ))
        )}
      </main>

      {/* [수정] 라이트박스 호출 부분 */}
      {lightboxState.isOpen && (
        <ImageLightbox
          imageUrls={lightboxState.imageUrls}
          startIndex={lightboxState.startIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}

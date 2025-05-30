// app/reviews/detail/[reviewId]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header2 from '@/components/Header2';
import styles from './ReviewDetailPage.module.css';

// 위에서 정의한 mockSubmittedReviews 또는 실제 데이터 fetching 함수
const mockSubmittedReviews = {
  'req1': { reviewId: 'reviewForReq1', requestId: 'req1', authorName: '홍길동', serviceDetails: '오피스텔 9평', serviceType: '입주청소', usageDate: '2023.03.25', rating: 4.9, text: '정말 더러웠어요. 제가 청소할 엄두가 도저히 나지 않아 맡겼는데 진작 맡길껄 그랬어요. 깨끗해요', imageUrls: ['/images/sample/review1.jpg', '/images/sample/review2.jpg', '/images/sample/review3.jpg', '/images/sample/window-clean.jpg', '/images/sample/review4.jpg', '/images/sample/review1.jpg'], createdAt: '2024-05-30T10:00:00Z' },
  'req2': { reviewId: 'reviewForReq2', requestId: 'req2', authorName: '김영희', serviceDetails: '아파트 32평', serviceType: '이사청소', usageDate: '2023.04.10', rating: 5, text: '꼼꼼하게 잘해주셔서 새집처럼 변했어요! 감사합니다.', imageUrls: ['/images/sample/review1.jpg', '/images/sample/review1.jpg'], createdAt: '2024-05-28T14:30:00Z' },
};

async function getReviewDetails(id) {
  // 실제로는 API 호출 또는 DB 조회
  // 예시: const review = await fetchFromDB('reviews', id);
  //      const request = await fetchFromDB('requests', review.requestId);
  //      return { ...review, ...request }; // 데이터 조합
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockSubmittedReviews[id] || null; // reviewId (또는 requestId)로 조회
}


export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params ? params.reviewId : null; // URL에서 reviewId 추출

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reviewId) {
      const fetchReview = async () => {
        setLoading(true);
        const reviewData = await getReviewDetails(reviewId);
        setReview(reviewData);
        setLoading(false);
      };
      fetchReview();
    } else {
      setLoading(false);
    }
  }, [reviewId]);

  const handleEdit = () => {
    // TODO: 수정 페이지로 이동 또는 수정 모달 열기
    console.log("수정 버튼 클릭:", reviewId);
    // router.push(`/reviews/edit/${reviewId}`);
    alert("리뷰 수정 기능은 준비 중입니다.");
  };

  const handleDelete = async () => {
    // TODO: 삭제 확인 컨펌 후 실제 삭제 로직 (API 호출 등)
    console.log("삭제 버튼 클릭:", reviewId);
    if (window.confirm("정말로 이 후기를 삭제하시겠습니까?")) {
      // await deleteReviewFromFirestore(reviewId);
      alert("후기가 삭제되었습니다. (실제 삭제 로직은 구현 필요)");
      router.push('/requests'); // 또는 후기 목록 페이지로 이동
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Header2 title="로딩 중..." onBack={() => router.back()} />
        <main className={styles.loadingText}>후기 정보를 불러오는 중입니다...</main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className={styles.pageContainer}>
        <Header2 title="오류" onBack={() => router.back()} />
        <main className={styles.errorText}>
          후기 정보를 찾을 수 없습니다. (ID: {reviewId || "알 수 없음"})<br />
          <Link href="/requests">신청 목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }
  
  // 표시할 이미지 (최대 2개, 추가 이미지는 +N으로 표시)
  const displayImages = review.imageUrls.slice(0, 2);
  const remainingImagesCount = review.imageUrls.length - displayImages.length;

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 제목은 "후기 상세" 또는 "작성된 후기" 등으로 변경하는 것이 좋습니다. */}
      <Header2 title="후기 상세" onBack={() => router.back()} />

      <main className={styles.contentArea}>
        <div className={styles.reviewCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTopLine}> {/* 첫 번째 줄 컨테이너 */}
              <p className={styles.authorName}>{review.authorName}</p>
              <p className={styles.usageDate}>이용날짜 {review.usageDate}</p>
            </div>
            <div className={styles.headerBottomLine}> {/* 두 번째 줄 컨테이너 */}
              <span className={styles.serviceDetails}>{review.serviceDetails}</span>
              <span className={styles.rating}>
                ⭐ {typeof review.rating === 'number' ? review.rating.toFixed(1) : review.rating}
              </span>
            </div>
          </div>

          <p className={styles.reviewText}>{review.text}</p>

          {review.imageUrls && review.imageUrls.length > 0 && (
            <div className={styles.imageGrid}>
              {displayImages.map((url, index) => (
                <div key={index} className={styles.imageWrapper}>
                  <Image src={url} alt={`후기 이미지 ${index + 1}`} layout="fill" objectFit="cover" className={styles.reviewImage}/>
                  {/* 마지막 이미지가 아니고, 추가 이미지가 있을 경우 오버레이 표시 */}
                  {index === 1 && remainingImagesCount > 0 && (
                    <div className={styles.moreImagesOverlay}>
                      +{remainingImagesCount}
                    </div>
                  )}
                </div>
              ))}
              {/* 이미지가 2개 미만이고 추가 이미지가 있는 경우, 빈 썸네일 공간을 만들고 오버레이 표시 */}
              {displayImages.length < 2 && remainingImagesCount > 0 && (
                <div className={styles.emptyImageWrapper}>
                  <div className={styles.moreImagesOverlay}>
                    +{remainingImagesCount}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
          수정
        </button>
        <button onClick={handleDelete} className={`${styles.actionButton} ${styles.editButton}`}>
          삭제
        </button>
      </footer>
    </div>
  );
}
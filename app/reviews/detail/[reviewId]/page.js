// /app/reviews/detail/[reviewId]/page.js (Firestore 연동)
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useModal } from '@/contexts/ModalContext';
import Link from 'next/link';
import Image from 'next/image';

// [수정] Firestore에서 필요한 함수들을 모두 임포트합니다. (getDocs 추가)
import { doc, getDoc, deleteDoc, collection, query, where, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

import Header2 from '@/components/Header2';
import styles from './ReviewDetailPage.module.css';

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  // URL 파라미터는 reviewId이지만 실제로는 requestId를 의미합니다.
  const requestId = params?.reviewId; 

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthor, setIsAuthor] = useState(false); // 작성자 여부 상태
  const { showAlert, showConfirm } = useModal(); 

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError('잘못된 접근입니다.');
      return;
    }

    const fetchReviewAndRequest = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. requestId를 사용하여 reviews 컬렉션에서 해당 리뷰 문서를 찾습니다.
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, where("requestId", "==", requestId));
        const reviewSnapshot = await getDocs(q);

        if (reviewSnapshot.empty) {
          throw new Error("해당 신청 내역에 대한 리뷰를 찾을 수 없습니다.");
        }
        
        const reviewDoc = reviewSnapshot.docs[0];
        const reviewData = reviewDoc.data();
        
        // 2. 해당 리뷰의 원본 신청 내역을 requests 컬렉션에서 가져옵니다.
        const requestRef = doc(db, 'requests', reviewData.requestId);
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.exists() ? requestSnap.data() : {};

        // 3. 두 데이터를 조합하여 최종 상태를 만듭니다.
        const combinedData = {
          reviewId: reviewDoc.id,
          requestId: reviewData.requestId,
          authorName: reviewData.userName,
          serviceType: reviewData.serviceType,
          usageDate: requestData.requestDate?.toDate().toLocaleDateString('ko-KR') || '정보 없음',
          serviceDetails: `${requestData.buildingType || ''} ${requestData.areaSize ? requestData.areaSize + '평' : ''}`,
          rating: reviewData.rating,
          text: reviewData.content,
          imageUrls: reviewData.imageUrls || [],
          createdAt: reviewData.createdAt?.toDate().toLocaleDateString('ko-KR') || '정보 없음'
        };

        setReview(combinedData);
        
        // 4. (보안) 현재 사용자가 작성자인지 확인
        const storedAuth = sessionStorage.getItem('identityVerifiedUser');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.name === reviewData.userName && authData.phoneNumber === reviewData.userPhone) {
            setIsAuthor(true);
          }
        }

      } catch (err) {
        console.error("Error fetching review details:", err);
        setError(err.message || '리뷰 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviewAndRequest();
  }, [requestId, router]);

  const handleEdit = () => {
    router.push(`/reviews/write/${requestId}`);
  };

  const handleDelete = async () => {
    if (!isAuthor || !review?.reviewId) return;

    showConfirm("정말로 이 후기를 삭제하시겠습니까?", async () => {
      try {
      // 리뷰 문서 삭제
      await deleteDoc(doc(db, 'reviews', review.reviewId));
      // 원본 신청 내역의 reviewWritten 상태 업데이트
      await updateDoc(doc(db, 'requests', requestId), { reviewWritten: false });
      
      showAlert("후기가 삭제되었습니다.");
      router.push('/requests'); // 신청 내역 목록으로 이동
      } catch (err) {
      console.error("Error deleting review:", err);
      showAlert("후기 삭제 중 오류가 발생했습니다.");
      }
    });
  };
  
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <Header2 title="로딩 중..." onBack={() => router.back()} />
        <main className={styles.loadingText}>후기 정보를 불러오는 중입니다...</main>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className={styles.pageContainer}>
        <Header2 title="오류" onBack={() => router.back()} />
        <main className={styles.errorText}>
          <p>{error || "후기 정보를 찾을 수 없습니다."}</p>
          <Link href="/requests">신청 목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }
  
  const displayImages = review.imageUrls.slice(0, 2);
  const remainingImagesCount = review.imageUrls.length - displayImages.length;

  return (
    <div className={styles.pageContainer}>
      <Header2 title="후기 상세" onBack={() => router.back()} />

      <main className={styles.contentArea}>
        <div className={styles.reviewCard}>
          <div className={styles.cardHeader}>
            <div className={styles.headerTopLine}>
              <p className={styles.authorName}>{review.authorName}</p>
              <p className={styles.usageDate}>이용날짜 {review.usageDate}</p>
            </div>
            <div className={styles.headerBottomLine}>
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
                  {index === 1 && remainingImagesCount > 0 && (
                    <div className={styles.moreImagesOverlay}>
                      +{remainingImagesCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 작성자일 경우에만 수정/삭제 버튼 표시 */}
      {isAuthor && (
        <footer className={styles.footer}>
          <button onClick={handleEdit} className={`${styles.actionButton} ${styles.editButton}`}>
            수정
          </button>
          <button onClick={handleDelete} className={`${styles.actionButton} ${styles.deleteButton}`}>
            삭제
          </button>
        </footer>
      )}
    </div>
  );
}

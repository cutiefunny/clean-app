// /app/admin/review/list/[id]/page.jsx (블라인드 기능 추가)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'; // updateDoc 임포트 추가
import { db } from '@/lib/firebase/clientApp';
import styles from '../../../board.module.css';
import { useAuth } from '../../../../context/AuthContext';

const REVIEWS_COLLECTION = "reviews";
const REQUESTS_COLLECTION = "requests";

// 별점 표시 컴포넌트
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.round(rating || 0);
  return (
    <div className={styles.starRatingContainer}>
      {[...Array(totalStars)].map((_, index) => (
        <span key={index} className={index < filledStars ? styles.starIconFilled : styles.starIconEmpty}>
          ★
        </span>
      ))}
      {rating && <span style={{ marginLeft: '8px', fontSize: '14px', color: '#555' }}>({rating.toFixed(1)})</span>}
    </div>
  );
};

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id;

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { permissions, isSuperAdmin } = useAuth();
  const canEdit = !loading && (isSuperAdmin || permissions?.reviews === 'edit');

  const fetchReviewDetail = useCallback(async () => {
    if (!reviewId) {
      setError("잘못된 접근입니다. 리뷰 ID가 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reviewDocRef = doc(db, REVIEWS_COLLECTION, reviewId);
      const reviewDocSnap = await getDoc(reviewDocRef);

      if (reviewDocSnap.exists()) {
        const reviewData = reviewDocSnap.data();
        let combinedData = {
          id: reviewDocSnap.id,
          ...reviewData,
          createdAt: reviewData.createdAt?.toDate ? reviewData.createdAt.toDate() : null,
        };

        if (reviewData.requestId) {
          const requestDocRef = doc(db, REQUESTS_COLLECTION, reviewData.requestId);
          const requestDocSnap = await getDoc(requestDocRef);

          if (requestDocSnap.exists()) {
            const requestData = requestDocSnap.data();
            combinedData = {
              ...combinedData,
              usageDate: requestData.requestDate?.toDate() || null,
              address: requestData.address || '정보 없음',
              buildingType: requestData.buildingType || '정보 없음',
              areaSize: requestData.areaSize || '정보 없음',
            };
          }
        }
        setReview(combinedData);
      } else {
        setError("해당 리뷰를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching review detail: ", err);
      setError(`리뷰 정보를 불러오는 중 오류 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetchReviewDetail();
  }, [fetchReviewDetail]);

  // [추가] 블라인드 처리 핸들러
  const handleBlindToggle = async () => {
    if (!reviewId || !canEdit) {
      alert("권한이 없습니다.");
      return;
    }
    
    const newBlindState = !(review?.blind); // 현재 상태의 반대값으로 설정
    const confirmMessage = newBlindState 
      ? "이 리뷰를 블라인드 처리하시겠습니까?" 
      : "이 리뷰의 블라인드 처리를 해제하시겠습니까?";

    if (window.confirm(confirmMessage)) {
      try {
        const reviewDocRef = doc(db, REVIEWS_COLLECTION, reviewId);
        await updateDoc(reviewDocRef, {
          blind: newBlindState
        });
        alert(`리뷰가 성공적으로 ${newBlindState ? '블라인드' : '블라인드 해제'} 처리되었습니다.`);
        // 로컬 상태를 즉시 업데이트하여 화면에 반영
        setReview(prev => ({ ...prev, blind: newBlindState }));
      } catch (err) {
        console.error("Error updating blind status: ", err);
        alert(`처리 중 오류 발생: ${err.message}.`);
      }
    }
  };


  const handleDelete = async () => {
    if (!reviewId || !canEdit) {
      alert("삭제 권한이 없습니다.");
      return;
    }
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
        alert("리뷰가 성공적으로 삭제되었습니다.");
        router.push('/admin/reviews/list');
      } catch (err) {
        console.error("Error deleting review: ", err);
        alert(`리뷰 삭제 중 오류 발생: ${err.message}.`);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\.$/, '');
  };

  if (loading) {
    return <div className={styles.pageContainer}><p className={styles.loadingText}>리뷰 정보를 불러오는 중...</p></div>;
  }
  if (error) {
    return <div className={styles.pageContainer}><p className={styles.errorText}>{error}</p></div>;
  }
  if (!review) {
    return <div className={styles.pageContainer}><p className={styles.emptyText}>리뷰 정보가 없습니다.</p></div>;
  }

  const photos = review.imageUrls && review.imageUrls.length > 0 ? review.imageUrls : [];

  return (
    <div className={styles.detailPageContainer}>
      <h1 className={styles.pageTitle}>리뷰 상세 보기</h1>
      <div className={styles.detailGrid}>
        
        {/* [추가] 블라인드 상태 표시 */}
        <div className={styles.detailLabel}>블라인드 상태</div>
        <div className={styles.detailValue} style={{ color: review.blind ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
          {review.blind ? '적용됨' : '미적용'}
        </div>

        <div className={styles.detailLabel}>리뷰등록일</div>
        <div className={styles.detailValue}>{formatDate(review.createdAt)}</div>

        <div className={styles.detailLabel}>이용날짜</div>
        <div className={styles.detailValue}>{formatDate(review.usageDate)}</div>

        <div className={styles.detailLabel}>이름</div>
        <div className={styles.detailValue}>{review.userName || '정보 없음'}</div>

        <div className={styles.detailLabel}>휴대폰번호</div>
        <div className={styles.detailValue}>{review.userPhone || '정보 없음'}</div>

        <div className={styles.detailLabel}>건물형태</div>
        <div className={styles.detailValue}>{review.buildingType}</div>

        <div className={styles.detailLabel}>평수</div>
        <div className={styles.detailValue}>{review.areaSize ? `${review.areaSize}평` : review.areaSize}</div>
        
        <div className={styles.detailLabel}>주소</div>
        <div className={styles.detailValue}>{review.address}</div>

        <div className={styles.detailLabel}>사진</div>
        <div className={`${styles.detailValue} ${styles.photoGallery}`}>
          {photos.length > 0 ? photos.map((photoSrc, index) => (
            <div key={index} className={styles.photoThumbnail}>
              <Image src={photoSrc} alt={`리뷰 사진 ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover' }} onError={(e) => e.currentTarget.src = 'https://placehold.co/100x100?text=Error'} />
            </div>
          )) : '첨부된 사진이 없습니다.'}
        </div>

        <div className={styles.detailLabel}>별점</div>
        <div className={styles.detailValue}><StarRating rating={review.rating} /></div>

        <div className={styles.detailLabel} style={{alignSelf: 'flex-start'}}>내용</div>
        <div className={styles.reviewContent}>{review.content || '내용 없음'}</div>
      </div>

      {/* [수정] 버튼 컨테이너 및 블라인드 버튼 추가 */}
      {canEdit && (
        <div className={styles.buttonContainer} style={{ justifyContent: 'flex-end', marginTop: '30px' }}>
          <button onClick={handleBlindToggle} className={`${styles.button} ${styles.secondaryButton}`}>
            {review.blind ? '블라인드 해제' : '블라인드 처리'}
          </button>
          <button onClick={handleDelete} className={`${styles.button} ${styles.deleteButton}`}>
            삭제
          </button>
        </div>
      )}
    </div>
  );
}


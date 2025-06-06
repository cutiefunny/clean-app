// /app/admin/review/list/[id]/page.jsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore'; // Timestamp 추가
import { db, auth } from '@/lib/firebase/clientApp'; // Firebase 경로
import styles from '../../../board.module.css'; // 공통 CSS Module (4단계 상위)

const COLLECTION_NAME = "reviews";

// 별점 표시 컴포넌트
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const filledStars = Math.round(rating); // 반올림하여 채워진 별 개수
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

  const fetchReviewDetail = useCallback(async () => {
    if (!reviewId) {
      setError("잘못된 접근입니다. 리뷰 ID가 없습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, COLLECTION_NAME, reviewId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setReview({
          id: docSnap.id,
          ...data,
          // Firestore Timestamp를 JavaScript Date 객체로 변환 (필요한 필드에 대해)
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
          usageDate: data.usageDate?.toDate ? data.usageDate.toDate() : null,
        });
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

  const handleDelete = async () => {
    if (!reviewId) {
      alert("삭제할 리뷰 ID가 없습니다.");
      return;
    }
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email.includes('admin')) { // 간단한 관리자 확인 예시
            // 실제로는 커스텀 클레임 (request.auth.token.admin == true) 등으로 확인 권장
            alert("삭제 권한이 없습니다.");
            return;
        }
        await deleteDoc(doc(db, COLLECTION_NAME, reviewId));
        alert("리뷰가 성공적으로 삭제되었습니다.");
        router.push('/admin/review/list'); // 목록 페이지로 이동
      } catch (err) {
        console.error("Error deleting review: ", err);
        alert(`리뷰 삭제 중 오류 발생: ${err.message}. Firestore 보안 규칙을 확인하세요.`);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\.$/, ''); // 마지막 점 제거
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

  // 더미 사진 데이터 (review.photos가 없을 경우 사용)
  const photos = review.photos && review.photos.length > 0 ? review.photos : ['/images/sample/review1.jpg', '/images/sample/review2.jpg', '/images/sample/review3.jpg'];


  return (
    <div className={styles.detailPageContainer}>
      <h1 className={styles.pageTitle}>리뷰 상세 보기</h1>

      <div className={styles.detailGrid}>
        <div className={styles.detailLabel}>리뷰등록일</div>
        <div className={styles.detailValue}>{formatDate(review.createdAt)}</div>

        <div className={styles.detailLabel}>이용날짜</div>
        <div className={styles.detailValue}>{formatDate(review.usageDate)}</div>

        <div className={styles.detailLabel}>이름</div>
        <div className={styles.detailValue}>{review.userName || '정보 없음'}</div>

        <div className={styles.detailLabel}>휴대폰번호</div>
        <div className={styles.detailValue}>{review.userPhone || '정보 없음'}</div>

        <div className={styles.detailLabel}>건물형태</div>
        <div className={styles.detailValue}>{review.buildingType || '정보 없음'}</div>

        <div className={styles.detailLabel}>평수</div>
        <div className={styles.detailValue}>{review.areaSize ? `${review.areaSize}평` : '정보 없음'}</div>
        
        <div className={styles.detailLabel}>주소</div>
        <div className={styles.detailValue}>{review.address || '정보 없음'}</div>

        <div className={styles.detailLabel}>사진</div>
        <div className={`${styles.detailValue} ${styles.photoGallery}`}>
          {photos.map((photoSrc, index) => (
            <div key={index} className={styles.photoThumbnail}>
              <Image src={photoSrc} alt={`리뷰 사진 ${index + 1}`} width={100} height={100} style={{ objectFit: 'cover' }} onError={(e) => e.currentTarget.src = '/images/placeholder.png'} />
            </div>
          ))}
        </div>

        <div className={styles.detailLabel}>별점</div>
        <div className={styles.detailValue}>
          <StarRating rating={review.rating} />
        </div>

        <div className={styles.detailLabel} style={{alignSelf: 'flex-start'}}>내용</div> {/* 내용 라벨 상단 정렬 */}
        <div className={styles.reviewContent}>
          {review.content || '내용 없음'}
        </div>
      </div>

      <div className={styles.deleteButtonContainer}>
        <button onClick={handleDelete} className={`${styles.button} ${styles.deleteButton}`}> {/* board.module.css의 deleteButton 클래스 사용 */}
          삭제
        </button>
      </div>
    </div>
  );
}
// components/RequestCard.js
'use client';

import Link from 'next/link';
import styles from './RequestCard.module.css';
import { useRouter } from 'next/navigation';

export default function RequestCard({ request }) {
  const router = useRouter();

  if (!request) {
    return null;
  }

  // 버튼 클릭 시 실행될 함수
  const handleReviewAction = () => {
    if (request.reviewwritten) {
      // 리뷰가 이미 작성된 경우 -> 후기 상세 페이지로 이동
      // request.id를 사용하여 해당 신청 건에 연결된 리뷰를 상세히 보여주는 페이지로 이동합니다.
      // 이전 단계에서 후기 상세 페이지 URL을 /reviews/detail/[id]로 가정했습니다.
      // 여기서 [id]는 request.id가 될 수도 있고, request 객체 내에 별도의 reviewId가 있다면 그것을 사용해야 합니다.
      // 여기서는 request.id를 사용한다고 가정합니다.
      router.push(`/reviews/detail/${request.id}`);
    } else {
      // 리뷰가 아직 작성되지 않은 경우 -> 후기 작성 페이지로 이동
      router.push(`/reviews/write/${request.id}`);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.serviceType}>{request.serviceType}</h3>
        {/* "자세히 보기"는 신청 내역 상세 페이지로 이동 */}
        <Link href={`/requests/${request.id}`} className={styles.detailsLink}>
          자세히 보기 ›
        </Link>
      </div>

      <div className={styles.infoGrid}>
        {/* 이용일, 건물형태, 평수, 공간정보 표시 부분은 그대로 유지 */}
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>이용일</span>
          <span className={styles.infoValue}>{request.usageDate}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>건물형태</span>
          <span className={styles.infoValue}>{request.buildingType}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>평수</span>
          <span className={styles.infoValue}>{request.area}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>공간정보</span>
          <span className={styles.infoValue}>{request.spaceInfo}</span>
        </div>
      </div>

      <button
        className={`${styles.reviewButton} ${request.reviewwritten ? styles.reviewButtonReverse : ''}`}
        onClick={handleReviewAction} // 수정된 핸들러 연결
      >
        {request.reviewwritten ? '후기 확인' : '후기 작성'}
      </button>
    </div>
  );
}
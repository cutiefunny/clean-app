// /components/RequestCard.js
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
    // 이미 작성된 리뷰는 확인 페이지로, 미작성 시 작성 페이지로 이동
    if (request.reviewWritten) {
      router.push(`/reviews/detail/${request.id}`);
    } else {
      router.push(`/reviews/write/${request.id}`);
    }
  };

  // [수정] 후기 작성/확인 버튼의 비활성화 여부를 결정하는 변수
  // canWriteReview가 false이고, 아직 리뷰가 작성되지 않았을 때만 버튼을 비활성화합니다.
  const isButtonDisabled = !request.canWriteReview && !request.reviewWritten;

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
        className={`${styles.reviewButton} ${request.reviewWritten ? styles.reviewButtonReverse : ''}`}
        onClick={handleReviewAction}
        // [수정] disabled 속성 추가
        disabled={isButtonDisabled}
        // [추가] 비활성화 시 사용자에게 이유를 알려주는 title 속성
        title={isButtonDisabled ? "이용일이 지나야 후기를 작성할 수 있습니다." : ""}
      >
        {request.reviewWritten ? '후기 확인' : '후기 작성'}
      </button>
    </div>
  );
}

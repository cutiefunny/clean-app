// components/RequestCard.js
'use client';

import Link from 'next/link';
import styles from './RequestCard.module.css';
import { useRouter } from 'next/navigation'; // useRouter 임포트

export default function RequestCard({ request }) {
  const router = useRouter(); // useRouter 훅 사용

  if (!request) {
    return null;
  }

  const handleWriteReview = () => {
    // router.push를 사용하여 동적 경로로 이동
    router.push(`/reviews/write/${request.id}`);
  };

return (
    <div className={styles.card}>
        <div className={styles.header}>
            <h3 className={styles.serviceType}>{request.serviceType}</h3>
            <Link href={`/requests/${request.id}`} className={styles.detailsLink}>
                자세히 보기 ›
            </Link>
        </div>

        <div className={styles.infoGrid}>
            {/* ... 기존 정보 표시 부분 ... */}
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
                    onClick={handleWriteReview}
            >
                    {request.reviewwritten ? '후기 확인' : '후기 작성'}
            </button>
    </div>
);
}
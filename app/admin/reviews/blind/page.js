// /app/admin/reviews/blind/page.jsx
"use client";

import styles from '../../board.module.css'; // 공통 CSS Module 임포트 (3단계 상위)

export default function ReviewBlindPage() {
  return (
    // pageContainer 대신 새로 추가한 centeredContentContainer 사용 또는
    // pageContainer 내부에 텍스트를 중앙 정렬하는 div를 추가할 수도 있습니다.
    // 여기서는 centeredContentContainer를 사용합니다.
    <div className={styles.centeredContentContainer}>
      <p className={styles.placeholderText}>
        요건 정의가 없고 어떤 기능인지 확실치 않아 일단 비워 뒀습니다.
      </p>
    </div>
  );
}
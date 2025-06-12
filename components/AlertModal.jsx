// components/AlertModal.jsx
'use client';

import React from 'react';
import styles from './AlertModal.module.css';

export default function AlertModal({ isOpen, title, message, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    // 배경 오버레이를 클릭하면 닫히도록 설정
    <div className={styles.overlay} onClick={onClose}>
      {/* 실제 대화상자: 이벤트 버블링을 막아 대화상자 클릭 시 닫히지 않게 함 */}
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        
        {/* 제목이 있을 경우에만 표시 */}
        {title && <h2 className={styles.title}>{title}</h2>}
        
        {/* 알림 메시지 */}
        <p className={styles.message}>{message}</p>
        
        {/* 확인 버튼 */}
        <div className={styles.buttonContainer}>
          <button className={styles.confirmButton} onClick={onClose}>
            확인
          </button>
        </div>
        
      </div>
    </div>
  );
}
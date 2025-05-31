// app/apply-cleaning/Step2Location.js
'use client';

import React from 'react';
import styles from './ApplyCleaning.module.css';
import { FaMapMarkerAlt } from 'react-icons/fa'; // 지도 마커 아이콘 사용

export default function Step2Location({ formData, updateFormData, onNext }) {
  const handleLocationSelect = () => {
    // TODO: 위치 선택 로직 구현 (예: 지도 API 연동, 주소 검색 등)
    // 선택 완료 후 formData 업데이트 및 다음 단계로 이동
    console.log("위치 선택 버튼 클릭");
    // 예시: updateFormData({ addressFull: '선택된 주소', addressDetail: '' });
    // 예시: onNext();
  };

  return (
    <div style ={{ backgroundColor: '#fff' }}>
      <h2 className={styles.stepTitle}>선택된 지역</h2>
      <div className={styles.locationSelectContainer}>
        <button
          type="button"
          className={styles.locationSelectButton}
          onClick={handleLocationSelect}
        >
          <FaMapMarkerAlt className={styles.locationIcon} />
          선택된 지역
        </button>
      </div>
      <button onClick={onNext} className={styles.nextButton}>다음</button>
    </div>
  );
}
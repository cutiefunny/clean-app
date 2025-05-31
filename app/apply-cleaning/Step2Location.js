// app/apply-cleaning/Step2Location.js
'use client';
import React from 'react';
import styles from './ApplyCleaning.module.css';

export default function Step2Location({ formData, updateFormData, onNext }) {
  // TODO: 지역 선택 UI (시/도, 시/군/구, 읍/면/동 선택) 및 로직 구현
  const handleNext = () => {
    // 예시: updateFormData({ addressFull: '...', addressDetail: '...' });
    onNext();
  };
  return (
    <div className={styles.stepContainer}>
      <p className={styles.placeholderText}>2단계: 지역 선택 (UI 구현 필요)</p>
      <p>선택된 지역: {formData.addressFull || "미선택"}</p>
      <button onClick={handleNext} className={styles.nextButton}>다음</button>
    </div>
  );
}
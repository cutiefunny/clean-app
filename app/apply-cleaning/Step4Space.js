// app/apply-cleaning/Step4Space.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';

const QuantityInput = ({ label, value, onDecrease, onIncrease, min = 0 }) => { // min prop 추가
  return (
    <div className={styles.quantityInputGroup}>
      <span className={styles.quantityLabel}>{label}</span>
      <div className={styles.quantityControls}>
        <button onClick={onDecrease} className={styles.quantityButton} disabled={value <= min}>-</button>
        <span className={styles.quantityValue}>{value}</span>
        <button onClick={onIncrease} className={styles.quantityButton}>+</button>
      </div>
    </div>
  );
};

export default function Step4Space({ formData, updateFormData }) {
  const [roomCount, setRoomCount] = useState(formData.roomCount || 1);
  const [bathroomCount, setBathroomCount] = useState(formData.bathroomCount || 1);
  const [verandaCount, setVerandaCount] = useState(formData.verandaCount || 0);
  const [additionalRequest, setAdditionalRequest] = useState(formData.additionalRequest || '');

  useEffect(() => {
    updateFormData({ roomCount, bathroomCount, verandaCount, additionalRequest });
  }, [roomCount, bathroomCount, verandaCount, additionalRequest, updateFormData]);

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>공간 정보</h2>
      <div className={styles.formGroup}>
        <QuantityInput
          label="방 개수"
          value={roomCount}
          onDecrease={() => setRoomCount(prev => Math.max(1, prev - 1))}
          onIncrease={() => setRoomCount(prev => prev + 1)}
          min={1} // 방 개수 최소 1
        />
      </div>
      <div className={styles.formGroup}>
        <QuantityInput
          label="화장실 개수"
          value={bathroomCount}
          onDecrease={() => setBathroomCount(prev => Math.max(1, prev - 1))}
          onIncrease={() => setBathroomCount(prev => prev + 1)}
          min={1} // 화장실 개수 최소 1
        />
      </div>
      <div className={styles.formGroup}>
        <QuantityInput
          label="베란다 개수"
          value={verandaCount}
          onDecrease={() => setVerandaCount(prev => Math.max(0, prev - 1))}
          onIncrease={() => setVerandaCount(prev => prev + 1)}
          min={0} // 베란다는 0개 가능
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="additionalRequest" className={styles.label}>추가 요청사항</label>
        <textarea
          id="additionalRequest"
          className={styles.textareaField}
          rows="5"
          placeholder="예) 창틀 청소도 신경 써주세요. 펫이 있어서 친환경 세제 사용 부탁드립니다."
          value={additionalRequest}
          onChange={(e) => setAdditionalRequest(e.target.value)}
        />
      </div>
      {/* "다음" 버튼은 ApplyCleaningForm.js에서 관리하므로 여기서 제거 */}
    </div>
  );
}
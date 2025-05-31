// app/apply-cleaning/Step4Space.js
'use client';

import React, { useState } from 'react';
import styles from './ApplyCleaning.module.css';

const QuantityInput = ({ label, value, onDecrease, onIncrease }) => {
  return (
    <div className={styles.quantityInputGroup}>
      <span className={styles.quantityLabel}>{label}</span>
      <div className={styles.quantityControls}>
        <button onClick={onDecrease} className={styles.quantityButton} disabled={value <= 0 && label !== '베란다' && value <=0 }>-</button> {/* 방/화장실 0개 안되도록, 베란다는 0개 가능 */}
        <span className={styles.quantityValue}>{value}</span>
        <button onClick={onIncrease} className={styles.quantityButton}>+</button>
      </div>
    </div>
  );
};

export default function Step4Space({ formData, updateFormData, onNext }) {
  const [roomCount, setRoomCount] = useState(formData.roomCount || 1);
  const [bathroomCount, setBathroomCount] = useState(formData.bathroomCount || 1);
  const [verandaCount, setVerandaCount] = useState(formData.verandaCount || 0);
  const [additionalRequest, setAdditionalRequest] = useState(formData.additionalRequest || '');

  const handleNext = () => {
    if (roomCount < 1 || bathroomCount < 1) {
      alert("방과 화장실 개수는 최소 1개 이상이어야 합니다.");
      return;
    }
    updateFormData({ roomCount, bathroomCount, verandaCount, additionalRequest });
    onNext();
  };

  return (
    <div style ={{ backgroundColor: '#fff' }}>
      <h2 className={styles.stepTitle}>공간 정보</h2>
      <div className={styles.formGroup}>
        <QuantityInput
          label="방 개수"
          value={roomCount}
          onDecrease={() => setRoomCount(prev => Math.max(1, prev - 1))}
          onIncrease={() => setRoomCount(prev => prev + 1)}
        />
      </div>
      <div className={styles.formGroup}>
        <QuantityInput
          label="화장실 개수"
          value={bathroomCount}
          onDecrease={() => setBathroomCount(prev => Math.max(1, prev - 1))}
          onIncrease={() => setBathroomCount(prev => prev + 1)}
        />
      </div>
      <div className={styles.formGroup}>
        <QuantityInput
          label="베란다 개수"
          value={verandaCount}
          onDecrease={() => setVerandaCount(prev => Math.max(0, prev - 1))}
          onIncrease={() => setVerandaCount(prev => prev + 1)}
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
      <button onClick={handleNext} className={styles.nextButton}>다음</button>
    </div>
  );
}
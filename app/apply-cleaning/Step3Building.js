// app/apply-cleaning/Step3Building.js
'use client';

import React, { useState } from 'react';
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

const buildingInfoOptions = [
  { id: 'sameAsHome', label: '우리 집 정보와 동일합니다. (저장된 정보 사용)' },
  { id: 'hasPhoto', label: '몇 평인지 잘 모르지만, 사진이 있습니다. (사진첨부)' },
  { id: 'dontKnow', label: '잘 모르겠습니다. (업체와 상담 후 결정)' },
  { id: 'knowsInfo', label: '정보를 알고 있습니다. (직접 입력)' },
];

export default function Step3Building({ formData, updateFormData, onNext }) {
  const [selectedOption, setSelectedOption] = useState(formData.buildingInfoType || '');

  const handleNext = () => {
    if (!selectedOption) {
      alert("건물 정보 제공 방식을 선택해주세요.");
      return;
    }
    updateFormData({ buildingInfoType: selectedOption });
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>건물 정보 입력 (선택 가능)</h2>
      <div className={styles.radioGroupVertical}>
        {buildingInfoOptions.map(option => (
          <label key={option.id} className={styles.radioLabelFullWidth}>
            <input
              type="radio"
              name="buildingInfoType"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {/* 선택된 옵션에 따라 추가 입력 필드가 나타날 수 있습니다.
          예: 'knowsInfo' 선택 시 평수, 건물 유형 직접 입력 필드 표시
          예: 'hasPhoto' 선택 시 사진 업로드 필드 표시
          이 부분은 요구사항에 따라 확장 가능합니다.
      */}
      <button onClick={handleNext} className={styles.nextButton}>다음</button>
    </div>
  );
}
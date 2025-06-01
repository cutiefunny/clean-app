// app/apply-cleaning/Step4Space.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

// 수량 입력 컴포넌트 (이전과 동일하게 사용 가능, min 기본값을 0으로 변경)
const QuantityInput = ({ label, value, onDecrease, onIncrease, min = 0 }) => {
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

const supplyAreaOptions = [
  "9평 이하", "10평대 (10~19평)", "20평대 (20~29평)", "30평대 (30~39평)", "40평 이상", "잘 모르겠어요"
];

const spaceStructureOptions = [
  "베란다 확장형", "비확장형", "복층형"
];

export default function Step4Space({ formData, updateFormData }) {
  const [supplyArea, setSupplyArea] = useState(formData.supplyArea || '');
  const [roomCount, setRoomCount] = useState(formData.roomCount || 0);
  const [bathroomCount, setBathroomCount] = useState(formData.bathroomCount || 0);
  const [verandaCount, setVerandaCount] = useState(formData.verandaCount || 0);
  const [spaceStructureType, setSpaceStructureType] = useState(formData.spaceStructureType || '');


  // 로컬 상태 변경 시 부모의 formData 업데이트
  useEffect(() => {
    updateFormData({ supplyArea, roomCount, bathroomCount, verandaCount, spaceStructureType });
  }, [supplyArea, roomCount, bathroomCount, verandaCount, spaceStructureType, updateFormData]);

  // formData prop 변경 시 로컬 상태 동기화 (선택적)
  useEffect(() => {
    if (formData.supplyArea !== undefined && formData.supplyArea !== supplyArea) {
      setSupplyArea(formData.supplyArea);
    }
    if (formData.roomCount !== undefined && formData.roomCount !== roomCount) {
      setRoomCount(formData.roomCount);
    }
    if (formData.bathroomCount !== undefined && formData.bathroomCount !== bathroomCount) {
      setBathroomCount(formData.bathroomCount);
    }
    if (formData.verandaCount !== undefined && formData.verandaCount !== verandaCount) {
      setVerandaCount(formData.verandaCount);
    }
    if (formData.spaceStructureType !== undefined && formData.spaceStructureType !== spaceStructureType) {
      setSpaceStructureType(formData.spaceStructureType);
    }
    // 의존성 배열에서 로컬 상태 변수를 제거하여, prop 변경에만 반응하도록 합니다.
    // 이렇게 하면 로컬 상태 변경이 이 useEffect를 다시 트리거하지 않습니다.
  }, [
    formData.supplyArea, formData.roomCount, formData.bathroomCount,
    formData.verandaCount, formData.spaceStructureType
  ]);


  // 각 핸들러에서 로컬 상태 업데이트 후 즉시 updateFormData 호출
  const handleSupplyAreaChange = (e) => {
    const value = e.target.value;
    setSupplyArea(value);
    updateFormData({ supplyArea: value });
  };

  const handleRoomCountChange = (newCount) => {
    setRoomCount(newCount);
    updateFormData({ roomCount: newCount });
  };
  const handleBathroomCountChange = (newCount) => {
    setBathroomCount(newCount);
    updateFormData({ bathroomCount: newCount });
  };
  const handleVerandaCountChange = (newCount) => {
    setVerandaCount(newCount);
    updateFormData({ verandaCount: newCount });
  };

  const handleSpaceStructureChange = (value) => {
    setSpaceStructureType(value);
    updateFormData({ spaceStructureType: value });
  };

  return (
    <div className={styles.stepContainer}>
      {/* 스텝 제목은 ApplyCleaningForm에서 관리 (예: <h2 className={styles.stepTitle}>공간 정보</h2>) */}
      {/* 여기서는 섹션 제목만 표시 */}

      <div className={styles.formGroup}>
        <label htmlFor="supplyArea" className={styles.label}>공급면적</label>
        <select
          id="supplyArea"
          className={`${styles.selectField} ${styles.step1Select}`} // Step1의 select 스타일 재활용
          value={supplyArea}
          onChange={handleSupplyAreaChange}
          required
        >
          <option value="">평형을 선택해주세요.</option>
          {supplyAreaOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>주거 구조</label>
        <QuantityInput
          label="방"
          value={roomCount}
          onDecrease={() => setRoomCount(prev => Math.max(0, prev - 1))} // 최소 0
          onIncrease={() => setRoomCount(prev => prev + 1)}
          min={0}
        />
        <QuantityInput
          label="화장실"
          value={bathroomCount}
          onDecrease={() => setBathroomCount(prev => Math.max(0, prev - 1))} // 최소 0
          onIncrease={() => setBathroomCount(prev => prev + 1)}
          min={0}
        />
        <QuantityInput
          label="베란다"
          value={verandaCount}
          onDecrease={() => setVerandaCount(prev => Math.max(0, prev - 1))}
          onIncrease={() => setVerandaCount(prev => prev + 1)}
          min={0}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>주거 공간의 형태</label>
        <div className={styles.radioGroup}> {/* Step1의 시간 선택 버튼 스타일 재활용 */}
          {spaceStructureOptions.map(type => (
            <button
              key={type}
              type="button"
              className={`${styles.radioLabelAsButton} ${spaceStructureType === type ? styles.radioLabelActive : ''}`}
              onClick={() => handleSpaceStructureChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      {/* "추가 요청사항" textarea는 제거됨 */}
      {/* "다음" 버튼은 ApplyCleaningForm.js에서 관리 */}
    </div>
  );
}
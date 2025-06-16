// app/apply-cleaning/Step4Space.js
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트
import { doc, getDoc } from 'firebase/firestore'; // Firestore 함수 임포트
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

// 수량 입력 컴포넌트
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

// 주거 공간 형태는 정적 데이터로 유지
const spaceStructureOptions = [
  "베란다 확장형", "비확장형", "복층형"
];

export default function Step4Space({ formData, updateFormData }) {
  // Firestore에서 가져온 옵션 상태
  const [flatSizesOptions, setFlatSizesOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // 사용자 입력 값 상태
  const [supplyArea, setSupplyArea] = useState(formData.supplyArea || '');
  const [roomCount, setRoomCount] = useState(formData.roomCount || 0);
  const [bathroomCount, setBathroomCount] = useState(formData.bathroomCount || 0);
  const [verandaCount, setVerandaCount] = useState(formData.verandaCount || 0);
  const [spaceStructureType, setSpaceStructureType] = useState(formData.spaceStructureType || '');

  // Firestore에서 평형 옵션 데이터 가져오기
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const docRef = doc(db, 'settings', 'cleaningOptions');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFlatSizesOptions(docSnap.data().flatSizes || []);
        } else {
          console.error("Cleaning options document not found!");
          setFlatSizesOptions([]);
        }
      } catch (error) {
        console.error("Error fetching flat size options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

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
  }, [
    formData.supplyArea, formData.roomCount, formData.bathroomCount,
    formData.verandaCount, formData.spaceStructureType
  ]);
  
  // [수정] 주거 공간 형태 선택/해제 핸들러
  const handleSpaceStructureChange = (type) => {
    setSpaceStructureType(prevType => (prevType === type ? '' : type));
  };


  if (loadingOptions) {
    return (
        <div className={styles.stepContainer}>
            <p>공간 정보를 불러오는 중입니다...</p>
        </div>
    );
  }

  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="supplyArea" className={styles.label}>공급면적</label>
        <select
          id="supplyArea"
          className={`${styles.selectField} ${styles.step1Select}`}
          value={supplyArea}
          onChange={(e) => setSupplyArea(e.target.value)}
          required
        >
          <option value="">평형을 선택해주세요.</option>
          {flatSizesOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>주거 구조</label>
        <QuantityInput
          label="방"
          value={roomCount}
          onDecrease={() => setRoomCount(prev => Math.max(0, prev - 1))}
          onIncrease={() => setRoomCount(prev => prev + 1)}
          min={0}
        />
        <QuantityInput
          label="화장실"
          value={bathroomCount}
          onDecrease={() => setBathroomCount(prev => Math.max(0, prev - 1))}
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
        <div className={styles.radioGroup}>
          {spaceStructureOptions.map(type => (
            <button
              key={type}
              type="button"
              className={`${styles.radioLabelAsButton} ${spaceStructureType === type ? styles.radioLabelActive : ''}`}
              // [수정] 새로운 핸들러 적용
              onClick={() => handleSpaceStructureChange(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

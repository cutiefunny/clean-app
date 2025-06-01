// app/apply-cleaning/Step3Building.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

const buildingTypeOptions = [
  "아파트", "빌라", "오피스텔", "단독주택", "다가구/다세대", "상가", "사무실", "기타"
];

const siteConditionOptions = [
  { id: 'vacant', label: '공실 상태입니다' },
  { id: 'someItems', label: '일부 짐이 있는 상태입니다' },
  { id: 'inBetweenCleaning', label: '당일 전 세입자 퇴거 후 이삿짐이 들어옵니다. (사이청소)' },
  { id: 'allItemsResidential', label: '모든 짐이 있는 상태입니다. (거주청소)' },
  { id: 'noElevator', label: '엘리베이터가 없습니다.' },
  { id: 'noParking', label: '주차가 불가능합니다' },
];

// 객체 깊은 비교 함수 (간단한 예시, 더 복잡한 객체면 lodash.isEqual 등 사용)
const  areObjectsEqual = (obj1, obj2) => {
    if (!obj1 || !obj2) return obj1 === obj2; // null 또는 undefined 처리
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
        if (obj1[key] !== obj2[key]) return false;
    }
    return true;
};

export default function Step3Building({ formData, updateFormData }) {
  // 건물 형태 상태
  const [buildingType, setBuildingType] = useState(formData.buildingType || '');

  // 당일 현장 상황 상태 (객체 형태로 각 옵션의 선택 여부 관리)
  const [siteConditions, setSiteConditions] = useState(
    formData.siteConditions || 
    siteConditionOptions.reduce((acc, option) => {
      acc[option.id] = false;
      return acc;
    }, {})
  );

  // 로컬 상태 변경 시 부모의 formData 업데이트
  useEffect(() => {
    updateFormData({ buildingType, siteConditions });
  }, [buildingType, siteConditions, updateFormData]);

  // formData prop 변경 시 로컬 상태 동기화 (선택적, 외부 변경 대응)
  useEffect(() => {
    // buildingType 동기화
    if (formData.buildingType !== undefined && formData.buildingType !== buildingType) {
      setBuildingType(formData.buildingType);
    }
    // siteConditions 동기화 (객체 비교 필요)
    if (formData.siteConditions && !areObjectsEqual(formData.siteConditions, siteConditions)) {
      setSiteConditions(formData.siteConditions);
    }
  }, [formData.buildingType, formData.siteConditions]);


  const handleBuildingTypeChange = (e) => {
    setBuildingType(e.target.value);
  };

  const handleSiteConditionChange = (conditionId) => {
    setSiteConditions(prevConditions => {
      const newConditions = {
        ...prevConditions,
        [conditionId]: !prevConditions[conditionId],
      };
      return newConditions;
    });
  };

  return (
    <div className={styles.stepContainer}>
      {/* 스텝 제목은 ApplyCleaningForm.js의 stepProgressContainer에서 표시 */}
      {/* <h2 className={styles.stepTitle}>건물 정보</h2> */} {/* 필요하다면 유지 */}

      <div className={styles.formGroup}>
        <label htmlFor="buildingType" className={styles.label}>건물 형태</label>
        <select
          id="buildingType"
          className={`${styles.selectField} ${styles.step1Select}`} // step1Select 스타일 재활용 가능
          value={buildingType}
          onChange={handleBuildingTypeChange}
          required
        >
          <option value="">형태를 선택해주세요.</option>
          {buildingTypeOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>당일 현장 상황 (중복 선택 가능)</label>
        <div className={styles.checkboxGroup}>
          {siteConditionOptions.map(option => (
            <label key={option.id} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={siteConditions[option.id] || false}
                onChange={() => handleSiteConditionChange(option.id)}
                className={styles.checkboxInput}
              />
              <span className={styles.checkboxCustom}></span> {/* 커스텀 체크박스 UI */}
              {option.label}
            </label>
          ))}
        </div>
      </div>
      {/* "다음" 버튼은 ApplyCleaningForm.js에서 관리하므로 여기서 제거 */}
    </div>
  );
}
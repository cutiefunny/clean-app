// app/apply-cleaning/Step3Building.js
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp'; // Firebase 설정 임포트
import { doc, getDoc } from 'firebase/firestore'; // Firestore 함수 임포트
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

// 객체 깊은 비교 함수 (간단한 예시)
const areObjectsEqual = (obj1, obj2) => {
  if (!obj1 || !obj2) return obj1 === obj2;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};

export default function Step3Building({ formData, updateFormData }) {
  // Firestore에서 불러온 옵션들을 저장할 상태
  const [buildingTypeOptions, setBuildingTypeOptions] = useState([]);
  const [siteConditionOptions, setSiteConditionOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // 사용자가 선택한 값에 대한 상태
  const [buildingType, setBuildingType] = useState(formData.buildingType || '');
  const [siteConditions, setSiteConditions] = useState(formData.siteConditions || {});

  // 컴포넌트 마운트 시 Firestore에서 옵션 데이터를 가져오는 useEffect
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const docRef = doc(db, 'settings', 'cleaningOptions');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedBuildingTypes = data.buildingTypes || [];
          const fetchedSiteConditions = data.siteConditions || [];

          setBuildingTypeOptions(fetchedBuildingTypes);
          
          // Firestore의 문자열 배열을 체크박스에서 사용할 객체 배열로 변환
          const formattedSiteOptions = fetchedSiteConditions.map(label => ({ id: label, label: label }));
          setSiteConditionOptions(formattedSiteOptions);

          // 불러온 옵션을 기반으로 siteConditions 상태 객체 초기화
          const initialConditionsState = formattedSiteOptions.reduce((acc, option) => {
            // 부모로부터 받은 formData에 기존 선택값이 있으면 유지
            acc[option.id] = formData.siteConditions?.[option.id] || false;
            return acc;
          }, {});
          setSiteConditions(initialConditionsState);
          
        } else {
          console.error("Cleaning options document not found!");
          // 에러 발생 시 빈 배열로 설정
          setBuildingTypeOptions([]);
          setSiteConditionOptions([]);
        }
      } catch (error) {
        console.error("Error fetching cleaning options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 한 번만 실행

  // 로컬 상태 변경 시 부모의 formData 업데이트
  useEffect(() => {
    // 옵션 로딩이 완료된 후에만 부모 상태 업데이트
    if (!loadingOptions) {
      updateFormData({ buildingType, siteConditions });
    }
  }, [buildingType, siteConditions, updateFormData, loadingOptions]);
  
  // formData prop 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (formData.buildingType !== undefined && formData.buildingType !== buildingType) {
      setBuildingType(formData.buildingType);
    }
    if (formData.siteConditions && !areObjectsEqual(formData.siteConditions, siteConditions)) {
      setSiteConditions(formData.siteConditions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.buildingType, formData.siteConditions]);

  const handleBuildingTypeChange = (e) => {
    setBuildingType(e.target.value);
  };

  const handleSiteConditionChange = (conditionId) => {
    setSiteConditions(prevConditions => ({
      ...prevConditions,
      [conditionId]: !prevConditions[conditionId],
    }));
  };
  
  if (loadingOptions) {
    return (
        <div className={styles.stepContainer}>
            <p>건물 정보를 불러오는 중입니다...</p>
        </div>
    );
  }

  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="buildingType" className={styles.label}>건물 형태</label>
        <select
          id="buildingType"
          className={`${styles.selectField} ${styles.step1Select}`}
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
              <span className={styles.checkboxCustom}></span>
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

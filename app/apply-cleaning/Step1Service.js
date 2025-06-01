// app/apply-cleaning/Step1Service.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';

export default function Step1Service({ formData, updateFormData, onNext }) {
  const [serviceType, setServiceType] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [desiredTime, setDesiredTime] = useState('');

  // useEffect는 formData prop (특히 serviceType)이 외부에서 변경될 때만 로컬 상태를 동기화합니다.
  useEffect(() => {
    // 외부에서 (예: URL 쿼리 파라미터) serviceType이 설정되었을 때 초기화
    if (formData.serviceType && formData.serviceType !== serviceType) {
      setServiceType(formData.serviceType);
    }
    // 초기 formData 값으로 desiredDate, desiredTime도 설정할 수 있습니다.
    if (formData.desiredDate && formData.desiredDate !== desiredDate) {
      setDesiredDate(formData.desiredDate);
    }
    if (formData.desiredTime && formData.desiredTime !== desiredTime) {
      setDesiredTime(formData.desiredTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.serviceType, formData.desiredDate, formData.desiredTime]); // 최초 마운트 시 및 prop 변경 시 동기화

  const handleServiceTypeChange = (e) => {
    const value = e.target.value;
    setServiceType(value);
    updateFormData({ serviceType: value });
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setDesiredDate(value);
    updateFormData({ desiredDate: value });
  };

//   const handleTimeChange = (value) => { // 버튼 클릭 시 직접 값 전달받음
//     setDesiredTime(value);
//     updateFormData({ desiredTime: value });
//   };

  // desiredTime 상태를 직접 업데이트하는 핸들러
  const handleDesiredTimeChange = (timeValue) => {
    setDesiredTime(timeValue);
    updateFormData({ desiredTime: timeValue });
    // updateFormData는 useEffect를 통해 호출되거나, 여기서 직접 호출할 수도 있습니다.
    // updateFormData({ desiredTime: timeValue }); // 즉시 반영을 원하면 여기서도 호출
  };

  const handleNext = () => {
    if (!serviceType || !desiredDate || !desiredTime) {
      alert("모든 필수 항목을 선택해주세요.");
      return;
    }
    // updateFormData는 이미 각 핸들러에서 호출되었으므로, formData는 최신 상태입니다.
    onNext();
  };

  const serviceOptions = [
    "신축 입주 청소", "이사 청소", "준공 리모델링 청소", "상가&사무실 청소", "기타 청소"
  ];

  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="serviceType" className={styles.label}>희망 서비스</label>
        <select
          id="serviceType"
          className={`${styles.selectField} ${styles.step1Select}`}
          value={serviceType} // 로컬 state 사용
          onChange={handleServiceTypeChange}
          required
        >
          <option value="">선택해주세요</option>
          {serviceOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="desiredDate" className={styles.label}>희망일 선택</label>
        <div className={styles.dateInputContainer}>
          <input
            type="date"
            id="desiredDate"
            className={`${styles.inputField} ${styles.step1Date}`}
            value={desiredDate} // 로컬 state 사용
            onChange={handleDateChange}
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>희망시간 선택</label>
        <div className={styles.radioGroup}>
          {['오전', '오후', '상담 후 협의'].map(time => (
            <label
              key={time}
              // 선택된 상태에 따라 .radioLabelActive 클래스 추가
              className={`${styles.radioLabelAsButton} ${desiredTime === time ? styles.radioLabelActive : ''}`}
            >
              <input
                type="radio"
                name="desiredTime" // 그룹화를 위해 name 속성 유지
                value={time}
                checked={desiredTime === time} // 실제 선택 상태는 input이 관리
                onChange={() => handleDesiredTimeChange(time)} // label 클릭으로 input 상태 변경
                required
                className={styles.hiddenRadioInput} // 이 클래스로 실제 라디오 버튼 숨김
              />
              {time}
            </label>
          ))}
        </div>
      </div>
      {/* 이 버튼은 ApplyCleaningForm의 하단 고정 버튼으로 대체됩니다. */}
      {/* <div className={styles.stepButtonContainer}>
        <button onClick={handleNext} className={styles.stepBottomButton}>다음</button>
      </div> */}
    </div>
  );
}
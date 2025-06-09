// app/apply-cleaning/Step1Service.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ApplyCleaning.module.css';

export default function Step1Service({ formData, updateFormData, onNext }) {
  const [serviceType, setServiceType] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const dateInputRef = useRef(null);

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

  // desiredTime 상태를 직접 업데이트하는 핸들러
  const handleDesiredTimeChange = (timeValue) => {
    setDesiredTime(timeValue);
    updateFormData({ desiredTime: timeValue });
  };

  // 커스텀 달력 아이콘 클릭 시 네이티브 날짜 선택기 표시
  const handleCalendarIconClick = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (error) {
        console.warn("dateInputRef.current.showPicker() is not supported in this browser. Trying focus().", error);
        dateInputRef.current.focus();
      }
    }
  };

  const serviceOptions = [
    "신축 입주 청소", "이사 청소", "준공 리모델링 청소", "상가&사무실 청소", "기타 청소"
  ];
  
  // [추가] 오늘 날짜를 YYYY-MM-DD 형식으로 구하기
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="serviceType" className={styles.label}>희망 서비스</label>
        <select
          id="serviceType"
          className={`${styles.selectField} ${styles.step1Select}`}
          value={serviceType}
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
            value={desiredDate}
            onChange={handleDateChange}
            required
            ref={dateInputRef}
            min={today} // [추가] 오늘 이전 날짜는 선택할 수 없도록 설정
          />
          <span
            className={styles.calendarIcon}
            onClick={handleCalendarIconClick}
            role="button"
            aria-label="날짜 선택 달력 열기"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCalendarIconClick(); }}
          ></span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>희망시간 선택</label>
        <div className={styles.radioGroup}>
          {['오전', '오후', '상담 후 협의'].map(time => (
            <label
              key={time}
              className={`${styles.radioLabelAsButton} ${desiredTime === time ? styles.radioLabelActive : ''}`}
            >
              <input
                type="radio"
                name="desiredTime"
                value={time}
                checked={desiredTime === time}
                onChange={() => handleDesiredTimeChange(time)}
                required
                className={styles.hiddenRadioInput}
              />
              {time}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

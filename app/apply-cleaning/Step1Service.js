// app/apply-cleaning/Step1Service.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유

// 간단한 달력 컴포넌트 (실제로는 react-datepicker 등 라이브러리 사용 권장)
const SimpleCalendar = ({ selectedDate, onDateChange }) => {
  // 이 부분은 UI만 간단히 표현, 실제 달력 기능은 복잡합니다.
  // 여기서는 입력 필드로 대체하거나, 선택된 날짜만 보여줍니다.
  return (
    <input
      type="date"
      className={styles.inputField}
      value={selectedDate}
      onChange={(e) => onDateChange(e.target.value)}
      required
    />
  );
};


export default function Step1Service({ formData, updateFormData, onNext }) {
  const [serviceType, setServiceType] = useState(formData.serviceType || '');
  const [desiredDate, setDesiredDate] = useState(formData.desiredDate || '');
  const [desiredTime, setDesiredTime] = useState(formData.desiredTime || '');

  // formData.serviceType이 외부(쿼리 파라미터)에서 변경될 때 반영
  useEffect(() => {
    setServiceType(formData.serviceType || '');
  }, [formData.serviceType]);


  const handleNext = () => {
    if (!serviceType || !desiredDate || !desiredTime) {
      alert("모든 필수 항목을 선택해주세요.");
      return;
    }
    updateFormData({ serviceType, desiredDate, desiredTime });
    onNext();
  };

  // 청소 서비스 종류 (실제로는 DB나 설정 파일에서 가져올 수 있음)
  const serviceOptions = [
    "신축 입주 청소",
    "이사 청소",
    "준공 리모델링 청소",
    "상가&사무실 청소",
    "기타 청소"
  ];


  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="serviceType" className={styles.label}>희망 서비스</label>
        <select
          id="serviceType"
          className={styles.selectField}
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
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
        {/* <SimpleCalendar selectedDate={desiredDate} onDateChange={setDesiredDate} /> */}
        {/* HTML5 기본 date input 사용 */}
        <input
            type="date"
            id="desiredDate"
            className={styles.inputField}
            value={desiredDate}
            onChange={(e) => setDesiredDate(e.target.value)}
            required
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>희망시간 선택</label>
        <div className={styles.radioGroup}>
          {['오전', '오후', '상담 후 협의'].map(time => (
            <label key={time} className={styles.radioLabel}>
              <input
                type="radio"
                name="desiredTime"
                value={time}
                checked={desiredTime === time}
                onChange={(e) => setDesiredTime(e.target.value)}
                required
              />
              {time}
            </label>
          ))}
        </div>
      </div>

      <button onClick={handleNext} className={styles.nextButton}>다음</button>
    </div>
  );
}
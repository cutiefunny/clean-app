// app/apply-cleaning/Step5Confirm.js
'use client';

import React, { useState } from 'react';
import styles from './ApplyCleaning.module.css';

export default function Step5Confirm({ formData, onSubmit }) {
  const [name, setName] = useState(formData.userName || ''); // formData에 미리 저장된 값이 있다면 사용
  const [phoneNumber, setPhoneNumber] = useState(formData.userPhoneNumber || '');

  const handleSubmit = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      alert("이름과 휴대폰 번호를 입력해주세요.");
      return;
    }
     if (!/^\d{10,11}$/.test(phoneNumber.replace(/-/g, ''))) {
        alert('올바른 휴대폰 번호를 입력해주세요.');
        return;
    }
    // 최종 formData에 이름과 휴대폰 번호 추가
    const finalFormData = { ...formData, userName: name, userPhoneNumber: phoneNumber };
    onSubmit(finalFormData); // 부모의 handleSubmitApplication 호출 (인자로 finalFormData 전달 가능)
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>청소 관련 정보 확인</h2>
      <div className={styles.summarySection}>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망 서비스:</span> {formData.serviceType}</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망일:</span> {formData.desiredDate}</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망시간:</span> {formData.desiredTime}</div>
        {/* formData.addressFull 등이 채워져 있다면 표시 */}
        {formData.addressFull && <div className={styles.summaryItem}><span className={styles.summaryLabel}>주소:</span> {formData.addressFull} {formData.addressDetail || ''}</div>}
        {formData.buildingInfoType && <div className={styles.summaryItem}><span className={styles.summaryLabel}>건물 정보 선택:</span> {formData.buildingInfoType}</div>} {/* 실제로는 레이블로 변환 필요 */}
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>방 개수:</span> {formData.roomCount}개</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>화장실 개수:</span> {formData.bathroomCount}개</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>베란다 개수:</span> {formData.verandaCount}개</div>
        {formData.additionalRequest && <div className={styles.summaryItem}><span className={styles.summaryLabel}>추가 요청:</span> <pre className={styles.preText}>{formData.additionalRequest}</pre></div>}
      </div>

      <div className={styles.formGroup} style={{marginTop: '20px'}}>
        <label htmlFor="userName" className={styles.label}>이름</label>
        <input
          type="text"
          id="userName"
          className={styles.inputField}
          placeholder="이름을 입력해주세요."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="userPhoneNumber" className={styles.label}>휴대폰 번호</label>
        <input
          type="tel"
          id="userPhoneNumber"
          className={styles.inputField}
          placeholder="휴대폰 번호 (- 없이 숫자만 입력)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
          maxLength={11}
          required
        />
      </div>

      <button onClick={handleSubmit} className={styles.nextButton} style={{backgroundColor: '#00C7AE', marginTop: '24px'}}>견적 비교 신청</button> {/* 버튼 색상 및 텍스트 변경 */}
    </div>
  );
}
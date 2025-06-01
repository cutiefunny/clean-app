// app/apply-cleaning/Step5Confirm.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';

export default function Step5Confirm({ formData, updateFormData }) {
  // Step5에서 입력받을 이름과 휴대폰 번호는 formData에서 직접 관리되도록 함
  // (부모인 ApplyCleaningForm에서 초기화 및 상태 관리)
  // 이 컴포넌트는 formData를 props로 받아 표시하고,
  // 이름/번호 입력 시 updateFormData를 호출하여 부모의 formData를 직접 변경합니다.

  const handleNameChange = (e) => {
    updateFormData({ userName: e.target.value });
  };

  const handlePhoneChange = (e) => {
    const newPhoneNumber = e.target.value.replace(/[^0-9]/g, '');
    updateFormData({ userPhoneNumber: newPhoneNumber });
  };

  // buildingInfoType에 대한 한글 레이블 매핑 (예시)
  const buildingInfoLabels = {
    sameAsHome: '우리 집 정보와 동일',
    hasPhoto: '사진 있음 (평수 모름)',
    dontKnow: '잘 모름 (상담 후 결정)',
    knowsInfo: '정보 직접 입력',
  };

  return (
    <div className={styles.stepContainer}>
      <h2 className={styles.stepTitle}>신청 정보 확인</h2>
      <div className={styles.summarySection}>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망 서비스:</span> {formData.serviceType || '-'}</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망일:</span> {formData.desiredDate || '-'}</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>희망시간:</span> {formData.desiredTime || '-'}</div>
        {formData.addressFull && <div className={styles.summaryItem}><span className={styles.summaryLabel}>주소:</span> {formData.addressFull} {formData.addressDetail || ''}</div>}
        {formData.buildingInfoType && <div className={styles.summaryItem}><span className={styles.summaryLabel}>건물 정보:</span> {buildingInfoLabels[formData.buildingInfoType] || formData.buildingInfoType}</div>}
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>방 개수:</span> {formData.roomCount}개</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>화장실 개수:</span> {formData.bathroomCount}개</div>
        <div className={styles.summaryItem}><span className={styles.summaryLabel}>베란다 개수:</span> {formData.verandaCount}개</div>
        {formData.additionalRequest && <div className={styles.summaryItem}><span className={styles.summaryLabel}>추가 요청:</span> <pre className={styles.preText}>{formData.additionalRequest}</pre></div>}
      </div>

      <div className={styles.formGroup} style={{marginTop: '20px'}}>
        <label htmlFor="userNameConfirm" className={styles.label}>이름 (필수)</label>
        <input
          type="text"
          id="userNameConfirm"
          className={styles.inputField}
          placeholder="이름을 입력해주세요."
          value={formData.userName || ''} // formData에서 직접 값 읽기
          onChange={handleNameChange}
          required
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="userPhoneNumberConfirm" className={styles.label}>휴대폰 번호 (필수)</label>
        <input
          type="tel"
          id="userPhoneNumberConfirm"
          className={styles.inputField}
          placeholder="휴대폰 번호 (- 없이 숫자만 입력)"
          value={formData.userPhoneNumber || ''} // formData에서 직접 값 읽기
          onChange={handlePhoneChange}
          maxLength={11}
          required
        />
      </div>
      {/* "견적 비교 신청" 버튼은 ApplyCleaningForm.js에서 관리하므로 여기서 제거 */}
    </div>
  );
}
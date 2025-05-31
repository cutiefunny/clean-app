// components/CheckModal.js (또는 ./checkModal.js)
'use client';

import React, { useState } from 'react';
import styles from './CheckModal.module.css'; // CSS 모듈 생성 필요

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false); // 인증번호 전송 여부 상태
  const [error, setError] = useState(''); // 오류 메시지 상태

  const handleSendCode = async () => {
    // 간단한 유효성 검사
    if (!name.trim() || !phoneNumber.trim()) {
      setError('이름과 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    // 휴대폰 번호 형식 검사 (선택 사항, 예: 10~11자리 숫자)
    if (!/^\d{10,11}$/.test(phoneNumber.replace(/-/g, ''))) {
        setError('올바른 휴대폰 번호를 입력해주세요.');
        return;
    }

    setError(''); // 이전 오류 메시지 초기화
    console.log(`인증번호 전송 시도: ${phoneNumber} (이름: ${name})`);
    // TODO: 실제 SMS 인증번호 발송 API 호출 로직 구현
    // 성공적으로 API 호출 후
    setIsCodeSent(true);
    alert('인증번호가 전송되었습니다. (실제 전송 로직은 구현 필요)');
    // setVerificationCode(''); // 인증번호 입력 필드 초기화 (선택 사항)
  };

  const handleVerifyAndProceed = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setError('이름과 휴대폰 번호를 입력해주세요.');
      return;
    }
    if (isCodeSent && !verificationCode.trim()) {
      setError('인증번호를 입력해주세요.');
      return;
    }
    if (!isCodeSent) {
      setError('먼저 인증번호를 전송해주세요.');
      return;
    }

    setError('');
    console.log(`인증 시도: 코드 ${verificationCode}`);
    // TODO: 실제 인증번호 검증 API 호출 로직 구현
    // 검증 성공 시
    const isSuccessfullyVerified = true; // 실제 검증 결과로 대체

    if (isSuccessfullyVerified) {
      if (onVerified) {
        onVerified(); // 부모 컴포넌트에 성공 알림 -> 페이지 이동 처리
      }
      onClose(); // 모달 닫기
      // 성공 후 상태 초기화
      setName('');
      setPhoneNumber('');
      setVerificationCode('');
      setIsCodeSent(false);
    } else {
      setError('인증번호가 올바르지 않습니다.');
    }
  };

  // 모달이 열려있지 않으면 아무것도 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}> {/* 오버레이 클릭 시 닫기 */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}> {/* 모달 내부 클릭은 전파 방지 */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>본인인증</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label htmlFor="nameInput" className={styles.label}>이름</label>
            <input
              type="text"
              id="nameInput"
              className={styles.inputField}
              placeholder="이름을 입력해주세요."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phoneInput" className={styles.label}>휴대폰 번호</label>
            <div className={styles.phoneInputWrapper}>
              <input
                type="tel"
                id="phoneInput"
                className={styles.inputField}
                placeholder="휴대폰 번호 (- 없이 숫자만 입력)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} // 숫자만 입력되도록
                maxLength={11}
              />
              <button
                onClick={handleSendCode}
                className={styles.sendCodeButton}
                disabled={isCodeSent || !name.trim() || !phoneNumber.trim()} // 코드 이미 전송했거나, 이름/번호 미입력 시 비활성화
              >
                {isCodeSent ? '재전송' : '전송'}
              </button>
            </div>
          </div>

          {isCodeSent && ( // 인증번호가 전송된 경우에만 인증번호 입력 필드 표시
            <div className={styles.inputGroup}>
              <label htmlFor="codeInput" className={styles.label}>인증번호</label>
              <input
                type="text" // 또는 "number"
                id="codeInput"
                className={styles.inputField}
                placeholder="인증번호"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6} // 일반적인 인증번호 길이
              />
            </div>
          )}
          
          {error && <p className={styles.errorMessage}>{error}</p>}

          <p className={styles.infoText}>
            *보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button
            onClick={handleVerifyAndProceed}
            className={styles.actionButton}
            disabled={!isCodeSent || !verificationCode.trim()} // 코드 미전송 또는 인증번호 미입력 시 비활성화
          >
            내역 조회
          </button>
        </div>
      </div>
    </div>
  );
}
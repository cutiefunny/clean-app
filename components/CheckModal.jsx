// components/CheckModal.js
'use client';

import React, { useState, useEffect } from 'react'; // useEffect 추가
import styles from './CheckModal.module.css';

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState('');

  // 컴포넌트 마운트 시 sessionStorage에서 기존 인증 정보 확인 (선택 사항)
  useEffect(() => {
    if (isOpen) { // 모달이 열릴 때만 확인
      const storedAuth = sessionStorage.getItem('identityVerifiedUser');
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          // 예시: 저장된 이름과 번호가 있고, 특정 시간 내라면 바로 onVerified 호출
          // 이 부분은 서비스 정책에 따라 더 정교하게 구현해야 합니다.
          // 여기서는 단순히 "인증된 적이 있다"는 사실만 확인하고 바로 onVerified를 호출하지는 않습니다.
          // 대신, 입력 필드를 채워줄 수는 있습니다.
          setName(authData.name || '');
          setPhoneNumber(authData.phoneNumber || '');
          // console.log("Previously verified data found:", authData);
        } catch (e) {
          console.error("Failed to parse stored auth data", e);
          sessionStorage.removeItem('identityVerifiedUser');
        }
      }
    }
  }, [isOpen]);


  const handleSendCode = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setError('이름과 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    if (!/^\d{10,11}$/.test(phoneNumber.replace(/-/g, ''))) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    setError('');
    console.log(`인증번호 전송 시도: ${phoneNumber} (이름: ${name})`);
    // TODO: 실제 SMS 인증번호 발송 API 호출 로직 구현
    setIsCodeSent(true);
    alert('인증번호가 전송되었습니다. (실제 전송 로직은 구현 필요. 테스트 해보시려면 123456을 입력하세요.)');
  };

  const handleVerifyAndProceed = async () => {
    // ... (기존 유효성 검사)
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
    
    // 더미 검증 로직: 인증번호가 '123456'이면 성공으로 간주
    const isSuccessfullyVerified = verificationCode === '123456';

    if (isSuccessfullyVerified) {
      // 1. sessionStorage에 인증 정보 저장
      const userAuthData = {
        name: name,
        phoneNumber: phoneNumber,
        verifiedAt: new Date().toISOString(), // 인증 시각 저장 (선택 사항)
        isVerified: true
      };
      sessionStorage.setItem('identityVerifiedUser', JSON.stringify(userAuthData));
      console.log('본인인증 정보가 세션에 저장되었습니다.', userAuthData);

      if (onVerified) {
        onVerified(); // 부모 컴포넌트에 성공 알림
      }
      onClose(); // 모달 닫기
      // 성공 후 상태 초기화 (선택 사항, 모달이 닫히므로 굳이 안 해도 될 수 있음)
      // setName('');
      // setPhoneNumber('');
      // setVerificationCode('');
      // setIsCodeSent(false);
    } else {
      setError('인증번호가 올바르지 않습니다.');
      // sessionStorage.removeItem('identityVerifiedUser'); // 실패 시 기존 정보 삭제 (선택 사항)
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ... (모달 UI는 이전과 동일) ... */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>본인인증</h2>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label htmlFor="nameInput" className={styles.label}>이름</label>
            <input type="text" id="nameInput" className={styles.inputField} placeholder="이름을 입력해주세요." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="phoneInput" className={styles.label}>휴대폰 번호</label>
            <div className={styles.phoneInputWrapper}>
              <input type="tel" id="phoneInput" className={styles.inputField} placeholder="휴대폰 번호 (- 없이 숫자만 입력)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11}/>
              <button onClick={handleSendCode} className={styles.sendCodeButton} disabled={isCodeSent || !name.trim() || !phoneNumber.trim()}>{isCodeSent ? '재전송' : '전송'}</button>
            </div>
          </div>
          {isCodeSent && (
            <div className={styles.inputGroup}>
              <label htmlFor="codeInput" className={styles.label}>인증번호</label>
              <input type="text" id="codeInput" className={styles.inputField} placeholder="인증번호" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} maxLength={6} />
            </div>
          )}
          {error && <p className={styles.errorMessage}>{error}</p>}
          <p className={styles.infoText}>*보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.</p>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={handleVerifyAndProceed} className={styles.actionButton} disabled={!isCodeSent || !verificationCode.trim()}>내역 조회</button>
        </div>
      </div>
    </div>
  );
}
// /components/CheckModal.js (수정된 코드)
'use client';

import React, { useState, useEffect } from 'react';
import styles from './CheckModal.module.css';
import useSmsVerification from '@/hooks/useSmsVerification';

export default function CheckModal({ isOpen, onClose, onVerified }) {
  // 1. 상태 변수 정리: 불필요한 state를 제거하고 이름을 명확하게 합니다.
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState(''); // 사용자가 입력한 인증번호
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [componentError, setComponentError] = useState(''); // 컴포넌트 내부 유효성 검사 오류

  // 2. useSmsVerification 훅에서 필요한 모든 값을 구조 분해 할당합니다.
  const { 
    sendVerificationCode, 
    loading, 
    error: apiError, // API 에러는 이름을 변경하여 구분
    data 
  } = useSmsVerification();
  
  // 서버에서 받은 실제 인증번호를 저장할 state
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');

  // 모달이 닫힐 때 모든 상태를 초기화합니다.
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhoneNumber('');
      setVerificationInput('');
      setIsCodeSent(false);
      setComponentError('');
      setSentCodeFromServer('');
    }
  }, [isOpen]);

  // 인증번호 발송 함수
  const handleSendCode = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setComponentError('이름과 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    // 휴대폰 번호 형식 유효성 검사
    if (!/^\d{10,11}$/.test(phoneNumber.replace(/-/g, ''))) {
      setComponentError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    
    setComponentError(''); // 기존 오류 메시지 초기화
    
    // 3. sendVerificationCode에 올바른 `phoneNumber` 상태를 전달합니다.
    const result = await sendVerificationCode(phoneNumber);
    
    // 4. API 호출 성공 시에만 후속 처리
    if (result && result.success) {
      alert('인증번호가 발송되었습니다.');
      setIsCodeSent(true);
      setSentCodeFromServer(result.verificationCode); // 서버에서 받은 인증번호 저장
    }
    // 실패 시에는 useSmsVerification 훅의 apiError가 자동으로 설정됩니다.
  };

  // 인증번호 확인 및 다음 단계 진행 함수
  const handleVerifyAndProceed = () => {
    if (!verificationInput.trim()) {
      setComponentError('인증번호를 입력해주세요.');
      return;
    }

    setComponentError('');

    // 5. 서버에서 받은 실제 인증번호와 사용자가 입력한 번호를 비교합니다.
    if (verificationInput === sentCodeFromServer) {
      alert("본인인증에 성공했습니다.");
      const userAuthData = {
        name: name,
        phoneNumber: phoneNumber,
        verifiedAt: new Date().toISOString(),
        isVerified: true
      };
      sessionStorage.setItem('identityVerifiedUser', JSON.stringify(userAuthData));

      if (onVerified) {
        onVerified(userAuthData); // 인증된 데이터를 부모 컴포넌트로 전달
      }
      onClose(); // 모달 닫기
    } else {
      setComponentError('인증번호가 올바르지 않습니다.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
              disabled={isCodeSent}
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
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                maxLength={11}
                disabled={isCodeSent}
              />
              <button onClick={handleSendCode} className={styles.sendCodeButton} disabled={loading || isCodeSent}>
                {loading ? '전송중...' : (isCodeSent ? '재전송' : '전송')}
              </button>
            </div>
          </div>
          {isCodeSent && (
            <div className={styles.inputGroup}>
              <label htmlFor="codeInput" className={styles.label}>인증번호</label>
              <input 
                type="text" 
                id="codeInput" 
                className={styles.inputField} 
                placeholder="인증번호" 
                value={verificationInput} 
                onChange={(e) => setVerificationInput(e.target.value)} 
                maxLength={6} 
              />
            </div>
          )}
          {/* 6. 컴포넌트 유효성 에러 또는 API 에러를 표시합니다. */}
          {(componentError || apiError) && <p className={styles.errorMessage}>{componentError || apiError}</p>}
          <p className={styles.infoText}>*보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.</p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            onClick={handleVerifyAndProceed} 
            className={styles.actionButton} 
            disabled={!isCodeSent || !verificationInput.trim() || loading}
          >
            내역 조회
          </button>
        </div>
      </div>
    </div>
  );
}

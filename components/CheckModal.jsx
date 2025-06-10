// /components/CheckModal.js (reCAPTCHA 제거 및 롤백)
'use client';

import React, { useState, useEffect } from 'react';
import styles from './CheckModal.module.css';
import useSmsVerification from '@/hooks/useSmsVerification';

// [제거] Firebase Auth 관련 모듈은 더 이상 필요 없습니다.
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [componentError, setComponentError] = useState('');

  const { sendVerificationCode, loading, error: apiError } = useSmsVerification();
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');
  
  // [제거] reCAPTCHA 및 Firebase Auth 관련 상태/ref 제거
  // const recaptchaContainerRef = useRef(null);
  // const [auth, setAuth] = useState(null);

  useEffect(() => {
    // 모달이 닫힐 때 모든 상태를 초기화합니다.
    if (!isOpen) {
      setName('');
      setPhoneNumber('');
      setVerificationInput('');
      setIsCodeSent(false);
      setComponentError('');
      setSentCodeFromServer('');
    }
  }, [isOpen]);

  // [제거] reCAPTCHA 설정 useEffect 제거

  const handleSendCode = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setComponentError('이름과 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    if (!/^\d{10,11}$/.test(phoneNumber.replace(/-/g, ''))) {
      setComponentError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    setComponentError('');

    try {
      // Firestore에서 일치하는 요청 내역 확인 (기존 로직 유지)
      const requestsRef = collection(db, 'requests');
      const q = query(
        requestsRef,
        where('applicantName', '==', name.trim()),
        where('applicantContact', '==', phoneNumber.replace(/-/g, ''))
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert('일치하는 요청 내역이 없습니다. 이름과 휴대폰 번호를 다시 확인해주세요.');
        return;
      }
      
      // 커스텀 훅을 사용한 SMS 발송
      const result = await sendVerificationCode(phoneNumber);
      
      if (result && result.success) {
        alert('인증번호가 발송되었습니다.');
        setIsCodeSent(true);
        setSentCodeFromServer(result.verificationCode);
      }
      
    } catch (err) {
      console.error("Error during Firestore query or SMS sending:", err);
      setComponentError('인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleVerifyAndProceed = () => {
    if (!verificationInput.trim()) {
      setComponentError('인증번호를 입력해주세요.');
      return;
    }
    setComponentError('');

    // [수정] 입력된 인증번호와 서버에서 받은 인증번호를 직접 비교
    if (verificationInput === sentCodeFromServer) {
      alert("본인인증에 성공했습니다.");
      
      const userAuthData = {
        name: name,
        phoneNumber: phoneNumber,
        verifiedAt: new Date().toISOString(),
        isVerified: true,
        // [제거] Firebase UID는 더 이상 없습니다.
      };
      sessionStorage.setItem('identityVerifiedUser', JSON.stringify(userAuthData));

      if (onVerified) {
        onVerified(userAuthData);
      }
      onClose();
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
        {/* [제거] reCAPTCHA 컨테이너 div 제거 */}
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
              disabled={loading || isCodeSent}
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
                disabled={loading || isCodeSent}
              />
              <button onClick={handleSendCode} className={styles.sendCodeButton} disabled={loading || isCodeSent}>
                {loading ? '확인중...' : (isCodeSent ? '재전송' : '전송')}
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
// /components/CheckModal.js (reCAPTCHA 및 디버깅 강화)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './CheckModal.module.css';
import useSmsVerification from '@/hooks/useSmsVerification';

// Firestore 및 Firebase Auth 모듈 임포트
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, RecaptchaVerifier } from "firebase/auth";
import { db } from '@/lib/firebase/clientApp';

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [componentError, setComponentError] = useState('');

  const { sendVerificationCode, loading, error: apiError } = useSmsVerification();
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');

  const recaptchaContainerRef = useRef(null);

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

  useEffect(() => {
    if (isOpen && recaptchaContainerRef.current) {
      try {
        const auth = getAuth();
        if (!window.recaptchaVerifier) {
          // 컨테이너가 실제로 DOM에 있는지 확인 후 verifier 생성
          window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
            'callback': (response) => {
              console.log("reCAPTCHA verified");
            }
          });
        }
        window.recaptchaVerifier.render().catch(err => {
            console.error("reCAPTCHA render error:", err);
            setComponentError("인증 위젯을 로드하는 데 실패했습니다. 페이지를 새로고침 해주세요.");
        });
      } catch (err) {
        console.error("Error setting up RecaptchaVerifier", err);
        setComponentError("인증 설정에 실패했습니다. 새로고침 후 다시 시도해주세요.");
      }
    }
  }, [isOpen]);


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

  const handleVerifyAndProceed = async () => {
    if (!verificationInput.trim()) {
      setComponentError('인증번호를 입력해주세요.');
      return;
    }
    setComponentError('');

    const isCodeCorrect = verificationInput === sentCodeFromServer;

    if (isCodeCorrect) {
      try {
        const auth = getAuth();
        const verifier = window.recaptchaVerifier;
        const userCredential = await signInAnonymously(auth, verifier);
        console.log("익명 로그인 성공:", userCredential.user.uid);

        alert("본인인증에 성공했습니다.");
        
        const userAuthData = {
          name: name,
          phoneNumber: phoneNumber,
          verifiedAt: new Date().toISOString(),
          isVerified: true,
          uid: userCredential.user.uid
        };
        sessionStorage.setItem('identityVerifiedUser', JSON.stringify(userAuthData));

        if (onVerified) {
          onVerified(userAuthData);
        }
        onClose();
      } catch(authError) {
        // [수정] 더 상세한 에러 로그를 출력하도록 변경
        console.error("Firebase 익명 로그인 실패:", authError);
        console.error("Firebase Auth Error Code:", authError.code);
        console.error("Firebase Auth Error Message:", authError.message);
        setComponentError(`인증 세션 생성 실패: ${authError.code}`);
        
        // reCAPTCHA 리셋
        window.recaptchaVerifier.render().catch(err => console.error("reCAPTCHA re-render error:", err));
      }
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
        {/* reCAPTCHA를 렌더링할 컨테이너는 항상 DOM에 존재해야 합니다. */}
        <div ref={recaptchaContainerRef}></div>
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

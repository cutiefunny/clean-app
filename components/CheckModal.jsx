// /components/CheckModal.js (최종 수정)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './CheckModal.module.css';
import useSmsVerification from '@/hooks/useSmsVerification';

// Firebase 모듈 임포트
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, RecaptchaVerifier } from "firebase/auth";
import { db, app } from '@/lib/firebase/clientApp'; // [수정] app 객체도 임포트

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [componentError, setComponentError] = useState('');

  const { sendVerificationCode, loading, error: apiError } = useSmsVerification();
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');
  const recaptchaContainerRef = useRef(null);
  
  // [추가] auth 인스턴스를 상태로 관리
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    // [추가] 컴포넌트 마운트 시 클라이언트에서만 getAuth() 호출
    setAuth(getAuth(app));

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
    // auth 객체가 초기화되고, 모달이 열려 있을 때 reCAPTCHA 설정
    if (isOpen && auth && recaptchaContainerRef.current) {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          'size': 'invisible',
          'callback': (response) => console.log("reCAPTCHA verified"),
        });
      }
      window.recaptchaVerifier.render().catch(err => {
        console.error("reCAPTCHA render error:", err);
        setComponentError("인증 위젯 로드 실패. 새로고침 해주세요.");
      });
    }
  }, [isOpen, auth]);


  const handleSendCode = async () => {
    // ... (기존 유효성 검사 로직은 동일)
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
      const q = query(requestsRef, where('applicantName', '==', name.trim()), where('applicantContact', '==', phoneNumber.replace(/-/g, '')));
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
      setComponentError('인증 처리 중 오류가 발생했습니다.');
    }
  };

  const handleVerifyAndProceed = async () => {
    // ... (기존 인증번호 확인 로직은 동일)
    if (!verificationInput.trim()) {
      setComponentError('인증번호를 입력해주세요.');
      return;
    }
    setComponentError('');

    if (verificationInput === sentCodeFromServer) {
      // [수정] auth 상태가 유효할 때만 로그인 시도
      if (!auth) {
        setComponentError("인증 서비스를 초기화하지 못했습니다. 새로고침 해주세요.");
        return;
      }
      try {
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
        console.error("Firebase 익명 로그인 실패:", authError);
        setComponentError(`인증 세션 생성 실패: ${authError.code}`);
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
        <div ref={recaptchaContainerRef}></div>
        <div className={styles.modalHeader}>
          {/* ... Modal Header ... */}
        </div>
        <div className={styles.modalBody}>
          {/* ... Modal Body ... */}
        </div>
        <div className={styles.modalFooter}>
          {/* ... Modal Footer ... */}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import styles from './CheckModal.module.css';
// [수정] 기존 useSmsVerification 훅 대신 useKakaoTalkSend 훅을 사용
import useKakaoTalkSend from '@/hooks/useKakaoTalkSend';
import { useModal } from '@/contexts/ModalContext';

// [제거] Firebase Auth 관련 모듈은 더 이상 필요 없습니다.
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

export default function CheckModal({ isOpen, onClose, onVerified }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [componentError, setComponentError] = useState('');
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');
  
  const { showAlert } = useModal();
  
  // [수정] useKakaoTalkSend 훅 사용
  const { sendKakaoTalk, loading, error: apiError } = useKakaoTalkSend();

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
        showAlert('일치하는 요청 내역이 없습니다. 이름과 휴대폰 번호를 다시 확인해주세요.');
        return;
      }
      
      // [수정] 6자리 랜덤 인증번호 생성
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const templateId = 'KA01TP221027002252645FPwAcO9SguY'; // 요청하신 알림톡 템플릿 ID
      const templateVariables = {
        '#{인증번호}': verificationCode,
      };

      // [수정] 커스텀 훅을 사용한 알림톡 발송
      const result = await sendKakaoTalk(phoneNumber, templateId, templateVariables);
      
      if (result && result.success) {
        showAlert('인증번호가 카카오 알림톡으로 발송되었습니다.');
        setIsCodeSent(true);
        // [수정] 생성된 인증번호를 상태에 저장
        setSentCodeFromServer(verificationCode);
      } else {
        // useKakaoTalkSend 훅에서 이미 error 상태를 관리하지만, 추가적인 에러 처리를 위해 확인
        setComponentError(apiError || '알림톡 발송에 실패했습니다.');
      }
      
    } catch (err) {
      console.error("Error during Firestore query or KakaoTalk sending:", err);
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
    if (verificationInput === sentCodeFromServer) { // 테스트용 코드
      showAlert("본인인증에 성공했습니다.");
      
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
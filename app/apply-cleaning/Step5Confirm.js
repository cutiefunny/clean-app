'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';
import useKakaoTalkSend from '@/hooks/useKakaoTalkSend';
import { useModal } from '@/contexts/ModalContext';

// [추가] Firestore 관련 모듈 임포트
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

const MAX_INQUIRY_LENGTH = 1000;
const OTP_TIMER_DURATION = 180; // 3분 = 180초
const ALIMTALK_TEMPLATE_ID = 'KA01TP221027002252645FPwAcO9SguY';
// [추가] 가입 환영 알림톡 템플릿 ID
const WELCOME_ALIMTALK_TEMPLATE_ID = 'KA01TP221025083117992xkz17KyvNbr';

export default function Step5Confirm({ formData, updateFormData }) {
  const { showAlert } = useModal();
  // 문의사항
  const [inquiryText, setInquiryText] = useState(formData.additionalRequest || '');

  // 본인인증 관련 상태
  const [name, setName] = useState(formData.userName || '');
  const [phoneNumber, setPhoneNumber] = useState(formData.userPhoneNumber || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(formData.otpVerified || false);
  const [timer, setTimer] = useState(OTP_TIMER_DURATION);
  const [otpError, setOtpError] = useState('');

  // useKakaoTalkSend 훅 사용
  const { sendKakaoTalk, loading: kakaoLoading, error: kakaoError } = useKakaoTalkSend();
  const [sentCodeFromServer, setSentCodeFromServer] = useState('');

  // formData 업데이트를 위한 useEffect (기존과 동일)
  useEffect(() => {
    updateFormData({ additionalRequest: inquiryText });
  }, [inquiryText, updateFormData]);

  useEffect(() => {
    updateFormData({ userName: name, userPhoneNumber: phoneNumber, otpVerified: isVerified });
  }, [name, phoneNumber, isVerified, updateFormData]);

  // 타이머 로직 (기존과 동일)
  useEffect(() => {
    let interval;
    if (isCodeSent && timer > 0 && !isVerified) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && isCodeSent && !isVerified) {
      setIsCodeSent(false);
      setOtpError("인증 시간이 초과되었습니다. 재전송해주세요.");
    }
    return () => clearInterval(interval);
  }, [isCodeSent, timer, isVerified]);

  const handleInquiryChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_INQUIRY_LENGTH) {
      setInquiryText(text);
    }
  };

  const handleNameChange = (e) => setName(e.target.value);
  const handlePhoneNumberChange = (e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));

  // 알림톡 전송 핸들러
  const handleSendOtp = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      setOtpError("이름과 휴대폰 번호를 입력해주세요.");
      return;
    }
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      setOtpError("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }
    setOtpError('');
    
    // 6자리 랜덤 인증번호 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const templateVariables = {
      '#{인증번호}': verificationCode,
    };
    
    const result = await sendKakaoTalk(phoneNumber, ALIMTALK_TEMPLATE_ID, templateVariables);
    
    if (result && result.success) {
      showAlert('인증번호가 카카오 알림톡으로 전송되었습니다.');
      setIsCodeSent(true);
      setTimer(OTP_TIMER_DURATION);
      setVerificationCode('');
      setSentCodeFromServer(verificationCode);
    } else {
      // 실패 시 useKakaoTalkSend 훅의 error 상태가 자동으로 설정됨
    }
  };

  // 4. 인증번호 확인 핸들러 구현
  const handleVerifyOtp = async () => {
    if (!verificationCode.trim()) {
      setOtpError("인증번호를 입력해주세요.");
      return;
    }
    setOtpError('');
    
    if (verificationCode === sentCodeFromServer) { // 테스트용 코드
      setIsVerified(true);
      showAlert('본인인증에 성공했습니다.');
      
      // [추가] 본인인증 성공 시 Firestore에서 요청 내역 확인
      try {
        const cleanedPhoneNumber = phoneNumber.replace(/-/g, '');
        const requestsRef = collection(db, 'requests');
        const q = query(
          requestsRef,
          where('applicantName', '==', name.trim()),
          where('applicantContact', '==', cleanedPhoneNumber)
        );
        const querySnapshot = await getDocs(q);
        
        // [로직 추가] Firestore에 일치하는 요청 내역이 없는 경우에만 가입 환영 알림톡 발송
        if (querySnapshot.empty) {
          console.log('일치하는 요청 내역이 없습니다. 가입 환영 알림톡을 발송합니다.');
          const welcomeMessageVariables = {
            '#{홍길동}': name.trim(), // 템플릿 변수에 따라 수정
            '#{url}': 'www.cleanapp.com', // 환영 메시지에 포함할 URL
          };
          const welcomeResult = await sendKakaoTalk(phoneNumber, WELCOME_ALIMTALK_TEMPLATE_ID, welcomeMessageVariables);

          if (welcomeResult && welcomeResult.success) {
            console.log('가입 환영 알림톡 발송 성공!');
          } else {
            console.error('가입 환영 알림톡 발송 실패:', welcomeResult);
          }
        }
      } catch (error) {
        console.error("Firestore 쿼리 또는 알림톡 발송 중 오류 발생:", error);
      }
      
    } else {
      setOtpError('인증번호가 올바르지 않습니다.');
      setIsVerified(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.formGroup}>
        <label htmlFor="inquiryText" className={styles.label}>청소 관련 문의사항</label>
        <div className={styles.textareaWrapper}>
          <textarea
            id="inquiryText"
            className={styles.textareaField}
            rows="6"
            placeholder="내용을 입력해주세요."
            value={inquiryText}
            onChange={handleInquiryChange}
            maxLength={MAX_INQUIRY_LENGTH}
          />
          <div className={styles.charCount}>
            {inquiryText.length} / {MAX_INQUIRY_LENGTH}자
          </div>
        </div>
      </div>

      <h3 className={styles.subSectionTitle}>본인인증</h3>
      <div className={styles.formGroup}>
        <input
          type="text"
          id="authName"
          className={styles.inputField}
          placeholder="이름"
          value={name}
          onChange={handleNameChange}
          disabled={isVerified}
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.phoneInputWrapper}>
          <input
            type="tel"
            id="authPhoneNumber"
            className={styles.inputField}
            placeholder="핸드폰 번호"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            maxLength={11}
            disabled={isVerified || (isCodeSent && timer > 0)}
          />
          <button
            onClick={handleSendOtp}
            className={styles.sendCodeButton}
            disabled={isVerified || kakaoLoading || (isCodeSent && timer > 0)}
          >
            {kakaoLoading ? '전송중...' : (isCodeSent && timer > 0 ? '재전송 불가' : (isVerified ? '인증완료' : '전송'))}
          </button>
        </div>
      </div>

      {isCodeSent && !isVerified && (
        <div className={styles.formGroup}>
          <label htmlFor="authVerificationCode" className={styles.label}>인증번호</label>
          <div className={styles.otpInputWrapper}>
            <input
              type="text"
              id="authVerificationCode"
              className={styles.inputField}
              placeholder="인증번호 입력"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            {timer > 0 && <span className={styles.timerText}>{formatTime(timer)}</span>}
            <button
              onClick={handleVerifyOtp}
              className={styles.verifyOtpButton}
              disabled={verificationCode.length < 6 || timer === 0}
            >
              인증확인
            </button>
          </div>
        </div>
      )}
      
      {(otpError || kakaoError) && <p className={styles.errorMessage}>{otpError || kakaoError}</p>}
      
      {!isVerified &&
        <p className={styles.infoTextSmall}>
          *보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.
        </p>
      }
      {isVerified && <p className={styles.successMessage}>본인인증이 완료되었습니다.</p>}
    </div>
  );
}
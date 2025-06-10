// /app/apply-cleaning/Step5Confirm.js (SMS 인증 기능 적용)
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';
import useSmsVerification from '@/hooks/useSmsVerification'; // 1. 훅 임포트

const MAX_INQUIRY_LENGTH = 1000;
const OTP_TIMER_DURATION = 180; // 3분 = 180초

export default function Step5Confirm({ formData, updateFormData }) {
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

  // 2. SMS 인증 훅 사용
  const { sendVerificationCode, loading: smsLoading, error: smsError } = useSmsVerification();
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

  // 3. SMS 전송 핸들러 구현
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
    
    const result = await sendVerificationCode(phoneNumber);
    
    if (result && result.success) {
      alert('인증번호가 전송되었습니다.');
      setIsCodeSent(true);
      setTimer(OTP_TIMER_DURATION);
      setVerificationCode('');
      setSentCodeFromServer(result.verificationCode);
    } 
    // 실패 시에는 useSmsVerification 훅의 smsError가 자동으로 설정되어 아래 JSX에서 표시됨
  };

  // 4. 인증번호 확인 핸들러 구현
  const handleVerifyOtp = async () => {
    if (!verificationCode.trim()) {
      setOtpError("인증번호를 입력해주세요.");
      return;
    }
    setOtpError('');
    
    if (verificationCode === sentCodeFromServer || verificationCode === '123456') { // 테스트용 코드
      setIsVerified(true);
      alert('본인인증에 성공했습니다.');
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
            disabled={isVerified || smsLoading || (isCodeSent && timer > 0)}
          >
            {smsLoading ? '전송중...' : (isCodeSent && timer > 0 ? '재전송 불가' : (isVerified ? '인증완료' : '전송'))}
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
      
      {(otpError || smsError) && <p className={styles.errorMessage}>{otpError || smsError}</p>}
      
      {!isVerified &&
        <p className={styles.infoTextSmall}>
          *보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.
        </p>
      }
      {isVerified && <p className={styles.successMessage}>본인인증이 완료되었습니다.</p>}
    </div>
  );
}

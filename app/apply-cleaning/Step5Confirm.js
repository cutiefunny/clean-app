// app/apply-cleaning/Step5Confirm.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ApplyCleaning.module.css';

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
  const [isVerified, setIsVerified] = useState(formData.otpVerified || false); // 인증 완료 여부
  const [timer, setTimer] = useState(OTP_TIMER_DURATION);
  const [otpError, setOtpError] = useState('');

  // 문의사항 변경 시 formData 업데이트
  useEffect(() => {
    updateFormData({ additionalRequest: inquiryText });
  }, [inquiryText, updateFormData]);

  // 이름, 휴대폰 번호, 인증 완료 상태 변경 시 formData 업데이트
  useEffect(() => {
    updateFormData({ userName: name, userPhoneNumber: phoneNumber, otpVerified: isVerified });
  }, [name, phoneNumber, isVerified, updateFormData]);


  // 타이머 로직
  useEffect(() => {
    let interval;
    if (isCodeSent && timer > 0 && !isVerified) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && isCodeSent && !isVerified) {
      setIsCodeSent(false); // 시간 초과 시 코드 재전송 가능하도록
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

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handlePhoneNumberChange = (e) => {
    const newPhoneNumber = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(newPhoneNumber);
  };

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
    console.log(`OTP 전송 시도: ${phoneNumber} (이름: ${name})`);
    // TODO: 실제 SMS OTP 발송 API 호출
    // 성공 시
    setIsCodeSent(true);
    setTimer(OTP_TIMER_DURATION); // 타이머 초기화 및 시작
    setVerificationCode(''); // 인증번호 입력 필드 초기화
    alert('인증번호가 전송되었습니다. (실제 전송 로직 필요)');
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode.trim()) {
      setOtpError("인증번호를 입력해주세요.");
      return;
    }
    setOtpError('');
    console.log(`OTP 검증 시도: ${verificationCode}`);
    // TODO: 실제 OTP 검증 API 호출
    // 성공 시
    // 더미 검증 로직: 인증번호가 '123456'이면 성공으로 간주
    if (verificationCode === '123456') {
      setIsVerified(true);
      alert('본인인증에 성공했습니다.');
      // updateFormData({ otpVerified: true }); // useEffect에서 처리됨
    } else {
      setOtpError('인증번호가 올바르지 않습니다.');
      setIsVerified(false);
      // updateFormData({ otpVerified: false }); // useEffect에서 처리됨
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className={styles.stepContainer}>
      {/* <h2 className={styles.stepTitle}>신청 정보 확인 및 본인인증</h2> */} {/* 상위 컴포넌트에서 스텝 타이틀 관리 */}

      <div className={styles.formGroup}>
        <label htmlFor="inquiryText" className={styles.label}>청소 관련 문의사항</label>
        {/* 새로운 wrapper div 추가 */}
        <div className={styles.textareaWrapper}>
          <textarea
            id="inquiryText"
            className={styles.textareaField} // 여기에 padding-bottom 추가 필요
            rows="6"
            placeholder="내용을 입력해주세요."
            value={inquiryText}
            onChange={handleInquiryChange}
            maxLength={MAX_INQUIRY_LENGTH}
          />
          <div className={styles.charCount}> {/* 위치가 textarea 내부 우측 하단으로 변경됨 */}
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
          disabled={isVerified} // 인증 완료 후 비활성화
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.phoneInputWrapper}> {/* 이전 CheckModal의 스타일 재활용 가능 */}
          <input
            type="tel"
            id="authPhoneNumber"
            className={styles.inputField}
            placeholder="핸드폰 번호"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            maxLength={11}
            disabled={isVerified || isCodeSent && timer > 0} // 인증 완료 또는 코드 전송 후 타이머 동작 중 비활성화
          />
          <button
            onClick={handleSendOtp}
            className={styles.sendCodeButton} // 이전 CheckModal 스타일 재활용 가능
            disabled={isVerified || (isCodeSent && timer > 0)} // 인증 완료 또는 타이머 동작 중 비활성화
          >
            {isCodeSent && timer > 0 ? '재전송 불가' : (isVerified ? '인증완료' : '전송')}
          </button>
        </div>
      </div>

      {isCodeSent && !isVerified && ( // 코드가 전송되었고 아직 인증 전일 때만 표시
        <div className={styles.formGroup}>
          <label htmlFor="authVerificationCode" className={styles.label}>인증번호</label>
          <div className={styles.otpInputWrapper}>
            <input
              type="text" // 또는 "number"
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
              className={styles.verifyOtpButton} // 새 스타일 또는 기존 버튼 스타일 활용
              disabled={verificationCode.length < 4 || timer === 0} // 예: 최소 4자리 이상, 타이머 종료 시 비활성화
            >
              인증확인
            </button>
          </div>
        </div>
      )}
      
      {otpError && <p className={styles.errorMessage}>{otpError}</p>}
      {!isVerified &&
        <p className={styles.infoTextSmall}>
          *보안 이슈로 이름과 휴대폰 번호로 본인인증을 완료해야 내 청소 내역을 확인할 수 있습니다.
        </p>
      }
      {isVerified && <p className={styles.successMessage}>본인인증이 완료되었습니다.</p>}

      {/* "견적 비교 신청" 버튼은 ApplyCleaningForm.js에서 관리 */}
    </div>
  );
}
// app/apply-cleaning/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // useSearchParams 추가
import styles from './ApplyCleaning.module.css';

// 각 단계별 컴포넌트 import (추후 생성)
import Step1Service from './Step1Service';
import Step2Location from './Step2Location'; // 플레이스홀더
import Step3Building from './Step3Building'; // 플레이스홀더
import Step4Space from './Step4Space';     // 플레이스홀더
import Step5Confirm from './Step5Confirm';   // 플레이스홀더

const TOTAL_STEPS = 5;

export default function ApplyCleaningPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // URL 쿼리 파라미터 읽기

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    desiredDate: '',
    desiredTime: '',
    addressFull: '',
    addressDetail: '',
    buildingInfoType: '', // Step3에서 선택한 옵션 ID
    roomCount: 1,         // Step4 기본값
    bathroomCount: 1,     // Step4 기본값
    verandaCount: 0,      // Step4 기본값
    additionalRequest: '',// Step4 추가 요청사항
    userName: '',         // Step5에서 입력받을 이름
    userPhoneNumber: '',  // Step5에서 입력받을 휴대폰 번호
  });

  // CustomizableCard에서 전달된 serviceType을 formData에 초기 설정
  useEffect(() => {
    const initialServiceType = searchParams.get('serviceType');
    if (initialServiceType) {
      setFormData(prev => ({ ...prev, serviceType: initialServiceType }));
    }
  }, [searchParams]);


  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 마지막 단계에서 "견적 비교 신청" 로직 처리
      handleSubmitApplication();
    }
  };

  const handlePrevStep = () => {
    // 최상단 뒤로가기 버튼은 router.back() 사용
    // 단계별 뒤로가기 버튼이 있다면 여기서 처리
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back(); // 첫 단계에서는 이전 페이지로
    }
  };

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleSubmitApplication = () => {
    console.log("최종 신청 데이터:", formData);
    // TODO: API로 formData 전송 로직
    alert("견적 비교 신청이 완료되었습니다! (실제 로직은 구현 필요)");
    router.push('/'); // 홈으로 이동 또는 신청 완료 페이지로 이동
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Service formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
      case 2:
        return <Step2Location formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
      case 3:
        return <Step3Building formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
      case 4:
        return <Step4Space formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
      case 5:
        return <Step5Confirm formData={formData} onSubmit={handleSubmitApplication} />; // 마지막 단계는 onSubmit 전달
      default:
        return <Step1Service formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={handlePrevStep} className={styles.backButton}>‹</button>
        <h1 className={styles.pageTitle}>청소신청</h1>
        <span className={styles.stepIndicator}>{currentStep}/{TOTAL_STEPS}</span>
      </header>
      <main className={styles.contentArea}>
        {renderStepContent()}
      </main>
      {/* "다음" 버튼은 각 Step 컴포넌트 내에 배치하거나, 여기에 공통으로 배치할 수도 있습니다.
          이미지에서는 각 스텝마다 "다음" 버튼이 있으므로 Step 컴포넌트 내부에 두는 것이 적절해 보입니다.
          Step5Confirm 에서는 "견적 비교 신청" 버튼이 됩니다.
      */}
    </div>
  );
}
// app/apply-cleaning/ApplyCleaningForm.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ApplyCleaning.module.css'; // 메인 CSS 모듈 공유
import Header2 from '@/components/Header2'; // 헤더 컴포넌트

// 각 단계별 컴포넌트 import
import Step1Service from './Step1Service';
import Step2Location from './Step2Location';
import Step3Building from './Step3Building';
import Step4Space from './Step4Space';
import Step5Confirm from './Step5Confirm';

const TOTAL_STEPS = 5;

export default function ApplyCleaningForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 이 훅 때문에 Suspense가 필요합니다.

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    desiredDate: '',
    desiredTime: '',
    addressFull: '',
    addressDetail: '',
    buildingInfoType: '',
    roomCount: 1,
    bathroomCount: 1,
    verandaCount: 0,
    additionalRequest: '',
    userName: '',
    userPhoneNumber: '',
  });

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
      handleSubmitApplication();
    }
  };

  const handleHeaderBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleSubmitApplication = () => {
    console.log("최종 신청 데이터:", formData);
    alert("견적 비교 신청이 완료되었습니다! (실제 로직은 구현 필요)");
    router.push('/');
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
        return <Step5Confirm formData={formData} onSubmit={handleSubmitApplication} />;
      default:
        return <Step1Service formData={formData} updateFormData={updateFormData} onNext={handleNextStep} />;
    }
  };

  return (
    <>
      <Header2
        title="청소신청"
        onBack={handleHeaderBack}
        // style prop은 Header2 내부 디자인에 따라 조절 필요
        // 예: style={{ display: 'flex', justifyContent: 'center' }}
      />

      <div className={styles.stepProgressContainer}>
        <span className={styles.stepProgressText}>
          {currentStep} / {TOTAL_STEPS}
        </span>
      </div>
      <main className={styles.contentArea}>
        {renderStepContent()}
      </main>
    </>
  );
}
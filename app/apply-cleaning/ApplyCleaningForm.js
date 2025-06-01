// app/apply-cleaning/ApplyCleaningForm.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'; // useCallback 추가
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ApplyCleaning.module.css';
import Header2 from '@/components/Header2';

import Step1Service from './Step1Service';
import Step2Location from './Step2Location';
import Step3Building from './Step3Building';
import Step4Space from './Step4Space';
import Step5Confirm from './Step5Confirm';

const TOTAL_STEPS = 5;

export default function ApplyCleaningForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: '',
    desiredDate: '',
    desiredTime: '',
    addressFull: '',
    addressDetail: '',
    buildingInfoType: '',
    // Step4 필드들
    supplyArea: '',         // 새로 추가
    roomCount: 0,           // 기본값 0으로 변경 (이미지 UI 기준)
    bathroomCount: 0,       // 기본값 0으로 변경
    verandaCount: 0,
    spaceStructureType: '', // 새로 추가
    userName: '',
    userPhoneNumber: '',
  });

   const didInitializeFromUrl = useRef(false);

   useEffect(() => {
  const serviceTypeFromQuery = searchParams.get('serviceType');
    if (serviceTypeFromQuery && !didInitializeFromUrl.current && (!formData.serviceType || formData.serviceType === '')) {
        setFormData(prevData => ({ ...prevData, serviceType: serviceTypeFromQuery }));
        didInitializeFromUrl.current = true; // 초기화되었음을 표시
    }
    }, [searchParams, formData.serviceType]);


  const updateFormData = useCallback((stepData) => {
    setFormData(prevFormData => ({ ...prevFormData, ...stepData }));
  }, []);

  // 각 단계별 유효성 검사 함수
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!formData.serviceType && !!formData.desiredDate && !!formData.desiredTime;
      case 2:
        return !!formData.addressFull; // 실제로는 더 상세한 검증 필요
      case 3:
        return !!formData.buildingType && Object.keys(formData.siteConditions || {}).length > 0; // siteConditions가 객체로 전달됨
      case 4:
        return !!formData.supplyArea &&
               formData.roomCount >= 0 &&
               formData.bathroomCount >= 0 &&
               formData.verandaCount >= 0 &&
               !!formData.spaceStructureType;
      case 5:
        return !!formData.userName && !!formData.userPhoneNumber && /^\d{10,11}$/.test(formData.userPhoneNumber.replace(/-/g, ''));
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNextStep = () => {
    if (!isStepValid()) {
      alert("현재 단계의 필수 정보를 모두 입력하거나 선택해주세요.");
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
    // 마지막 단계의 "다음"은 handleSubmitApplication으로 처리됨
  };

  const handleHeaderBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

//   const updateFormData = useCallback((stepData) => {
//     setFormData(prevFormData => ({ ...prevFormData, ...stepData }));
//   }, []);

  const handleSubmitApplication = () => {
    if (!isStepValid()) { // 최종 제출 전 유효성 검사
      alert("이름과 휴대폰 번호를 정확히 입력해주세요. (또는 이전 단계 정보 누락)");
      return;
    }
    console.log("최종 신청 데이터:", formData);
    alert("견적 비교 신청이 완료되었습니다! (실제 로직은 구현 필요)");
    router.push('/');
  };

  const renderStepContent = () => {
    // 이제 Step1-4는 onNext prop이 필요 없습니다.
    switch (currentStep) {
      case 1:
        return <Step1Service formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Location formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Building formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4Space formData={formData} updateFormData={updateFormData} />;
      case 5:
        // Step5Confirm은 formData를 받아 표시하고, 이름/번호 입력 시 updateFormData를 호출합니다.
        // 제출은 부모의 버튼이 담당합니다.
        return <Step5Confirm formData={formData} updateFormData={updateFormData} />;
      default:
        return <Step1Service formData={formData} updateFormData={updateFormData} />;
    }
  };

  return (
    <div className={styles.formContainerWithFixedFooter}> {/* 이 div가 flex column 역할 */}
      <Header2
        title="청소신청"
        onBack={handleHeaderBack}
      />
      <div className={styles.stepProgressContainer}>
        <span className={styles.stepProgressText}>
          {currentStep} / {TOTAL_STEPS}
        </span>
      </div>

      <main className={styles.scrollableContentArea}>
        {renderStepContent()}
      </main>

      <div className={styles.fixedButtonFooter}>
        <button
          onClick={currentStep === TOTAL_STEPS ? handleSubmitApplication : handleNextStep}
          className={styles.footerButton}
          disabled={!isStepValid()} // 유효성 검사에 따라 버튼 비활성화
        >
          {currentStep === TOTAL_STEPS ? '견적 비교 신청' : '다음'}
        </button>
      </div>
    </div>
  );
}
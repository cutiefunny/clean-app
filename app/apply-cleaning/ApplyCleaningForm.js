// app/apply-cleaning/ApplyCleaningForm.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ApplyCleaning.module.css';
import Header2 from '@/components/Header2';
import { useModal } from '@/contexts/ModalContext';

// Firestore 모듈 및 db 객체 임포트
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

import Step1Service from './Step1Service';
import Step2Location from './Step2Location';
import Step3Building from './Step3Building';
import Step4Space from './Step4Space';
import Step5Confirm from './Step5Confirm';

const TOTAL_STEPS = 5;

export default function ApplyCleaningForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useModal();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); // 제출 로딩 상태 추가
  const [formData, setFormData] = useState({
    serviceType: '',
    desiredDate: '',
    desiredTime: '',
    addressFull: '',
    addressDetail: '',
    buildingType: '', 
    siteConditions: {},
    supplyArea: '',       
    roomCount: 0,         
    bathroomCount: 0,      
    verandaCount: 0,
    spaceStructureType: '',
    additionalRequest: '', 
    userName: '',          
    userPhoneNumber: '',   
    otpVerified: false,    
  });

  const didInitializeFromUrl = useRef(false);

  useEffect(() => {
    const serviceTypeFromQuery = searchParams.get('serviceType');
    if (serviceTypeFromQuery && !didInitializeFromUrl.current && (!formData.serviceType || formData.serviceType === '')) {
        setFormData(prevData => ({ ...prevData, serviceType: serviceTypeFromQuery }));
        didInitializeFromUrl.current = true;
    }
  }, [searchParams, formData.serviceType]);


  const updateFormData = useCallback((stepData) => {
    setFormData(prevFormData => ({ ...prevFormData, ...stepData }));
  }, []);

  const isStepValid = useCallback(() => {
    // ... (유효성 검사 로직은 기존과 동일)
    switch (currentStep) {
        case 1:
          return !!formData.serviceType && !!formData.desiredDate && !!formData.desiredTime;
        case 2:
          return !!formData.addressFull;
        case 3:
          return !!formData.buildingType && Object.keys(formData.siteConditions || {}).length > 0;
        case 4:
          return !!formData.supplyArea && formData.roomCount >= 1 && formData.bathroomCount >= 0 && formData.verandaCount >= 0;
        case 5:
          return !!formData.userName && !!formData.userPhoneNumber && /^\d{10,11}$/.test(formData.userPhoneNumber.replace(/-/g, '')) && !!formData.otpVerified;
        default:
          return false;
      }
  }, [currentStep, formData]);

  const handleNextStep = () => {
    if (!isStepValid()) {
      showAlert("현재 단계의 필수 정보를 모두 입력하거나 선택해주세요.");
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleHeaderBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  // [수정] Firestore에 데이터를 저장하는 함수
  const handleSubmitApplication = async () => {
    if (!isStepValid()) {
      showAlert("본인인증을 포함하여 모든 필수 정보를 입력해주세요.");
      return;
    }
    setIsSubmitting(true);

    try {
        // Firestore 'requests' 컬렉션 스키마에 맞게 데이터 재구성
        const dataToSave = {
            field: formData.serviceType,
            requestDate: Timestamp.fromDate(new Date(formData.desiredDate)),
            requestTimeSlot: formData.desiredTime,
            address: `${formData.addressFull} ${formData.addressDetail}`,
            buildingType: formData.buildingType,
            areaSize: formData.supplyArea,
            spaceInfo: `방${formData.roomCount}, 화장실${formData.bathroomCount}, 베란다${formData.verandaCount}, ${formData.spaceStructureType}`,
            siteConditions: formData.siteConditions, // 현장상태
            applicantName: formData.userName,
            applicantContact: formData.userPhoneNumber.replace(/-/g, ''),
            inquiryNotes: formData.additionalRequest,
            status: '전송대기', // 초기 상태
            reviewWritten: false, // 리뷰 작성 여부 초기값
            createdAt: serverTimestamp(), // 서버 시간 기준 생성일
        };

        // 'requests' 컬렉션에 문서 추가
        const docRef = await addDoc(collection(db, 'requests'), dataToSave);
        console.log("Document written with ID: ", docRef.id);

        showAlert("견적 비교 신청이 성공적으로 완료되었습니다.");
        router.push('/'); // 성공 후 홈으로 이동

    } catch (error) {
        console.error("Error adding document: ", error);
        showAlert("신청 제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
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
        return <Step5Confirm formData={formData} updateFormData={updateFormData} />;
      default:
        return <Step1Service formData={formData} updateFormData={updateFormData} />;
    }
  };

  return (
    <div className={styles.formContainerWithFixedFooter}>
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
          // [수정] 제출 중일 때도 비활성화
          disabled={!isStepValid() || isSubmitting} 
        >
          {isSubmitting ? '신청 중...' : (currentStep === TOTAL_STEPS ? '견적 비교 신청' : '다음')}
        </button>
      </div>
    </div>
  );
}

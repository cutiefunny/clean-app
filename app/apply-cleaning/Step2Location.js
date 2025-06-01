// app/apply-cleaning/Step2Location.js
'use client';

import React, { useState, useEffect } from 'react';
import styles from './ApplyCleaning.module.css';
import LocationSelectModal from '@/components/LocationSelectModal'; // (추후 생성 또는 임포트)

export default function Step2Location({ formData, updateFormData }) {
  // addressFull은 "시/도 시/군/구 읍/면/동" 형태의 전체 주소를 저장한다고 가정
  // addressDetail은 필요한 경우 별도로 관리하거나, 모달 내에서 함께 처리
  const [selectedAddress, setSelectedAddress] = useState(formData.addressFull || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // formData.addressFull prop 변경 시 로컬 상태 동기화 (선택적)
  useEffect(() => {
    if (formData.addressFull && formData.addressFull !== selectedAddress) {
      setSelectedAddress(formData.addressFull);
    }
  }, [formData.addressFull, selectedAddress]);

  const openLocationModal = () => {
    setIsModalOpen(true);
  };

  const closeLocationModal = () => {
    setIsModalOpen(false);
  };

  const handleLocationSelect = (fullAddress) => {
    // 모달에서 최종 주소(예: "서울 강남구 삼성동")를 선택했을 때 호출될 함수
    setSelectedAddress(fullAddress);
    updateFormData({ addressFull: fullAddress, addressDetail: '' }); // 상세주소는 초기화 또는 모달에서 같이 받음
    closeLocationModal();
  };

  return (
    <div className={styles.stepContainer}>
      {/* 페이지 상단에 현재 스텝을 표시하는 부분 (ApplyCleaningForm.js에서 이미 처리) */}
      {/* <div className={styles.stepIndicatorFraction}>2/5</div> 삭제 */}

      <h2 className={styles.stepTitleSlim}>선택된 지역</h2> {/* 이미지의 "선택된 지역" 텍스트 */}

      <div className={styles.formGroup}>
        <button
          type="button"
          className={styles.locationSelectButton}
          onClick={openLocationModal}
        >
          <img src="/images/marker-pin-01.png" alt="지역 선택 아이콘" className={styles.locationIcon} />
          {selectedAddress || '선택된 지역'} {/* 선택된 주소 또는 기본 텍스트 */}
        </button>
      </div>

      {/* 지역 선택 모달 (LocationSelectModal)
        이 부분은 실제 모달 컴포넌트로 대체되어야 합니다.
        모달은 시/도, 시/군/구, 읍/면/동을 단계적으로 선택하는 UI를 가집니다.
      */}
      {isModalOpen && (
        <LocationSelectModal
          isOpen={isModalOpen}
          onClose={closeLocationModal}
          onSelect={handleLocationSelect}
          currentAddress={selectedAddress}
        />
      )}

      {/* "다음" 버튼은 ApplyCleaningForm.js에서 관리하므로 여기서 제거 */}
    </div>
  );
}
// Header.js (또는 해당 파일 경로)
'use client'; // useState, useRouter 사용을 위해 추가

import React, { useState } from 'react'; // useState import
import CheckModal from './CheckModal'; // 경로가 맞는지 확인
import { useRouter } from 'next/navigation'; // useRouter import

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter(); // useRouter 훅 사용

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 본인인증 성공 시 호출될 콜백 함수
  const handleVerificationSuccess = () => {
    console.log('본인인증 성공! /requests 페이지로 이동합니다.');
    setIsModalOpen(false); // 모달을 닫고
    router.push('/requests'); // '/requests' 페이지로 이동
  };

  return (
    <> {/* 여러 요소를 반환하므로 Fragment 또는 div로 감싸기 */}
      <header style={{ width: '100%', backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 50 }}> {/* 헤더 고정 예시 */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left Section (로고) - 클릭 시 새로고침 대신 홈으로 이동 권장 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => router.push('/')}> {/* 홈으로 이동 */}
              <div style={{ flexShrink: '0' }}>
                <img
                  src="/images/logo.png" // public/images/logo.png 에 로고 이미지 필요
                  alt="Logo"
                  style={{ width: '40px', height: '40px', objectFit: 'contain', verticalAlign: 'middle' }}
                />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A5568' }}>
                똑똑한 선택, 빠른 견적
              </span>
            </div>

            {/* Right Section ("내 신청내역") */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={handleOpenModal} // window.location.href 대신 모달 열기 함수 호출
            >
              <div style={{ flexShrink: '0' }}>
                <img
                  src="/images/file-02.png" // public/images/file-02.png 에 파일 아이콘 이미지 필요
                  alt="File Icon"
                  style={{ width: '24px', height: '24px', objectFit: 'contain', verticalAlign: 'middle' }}
                />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#4A5568' }}>
                내 신청내역
              </span>
            </div>
          </div>
        </div>
      </header>
      {/* CheckModal 컴포넌트 렌더링 */}
      <CheckModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onVerified={handleVerificationSuccess}
      />
    </>
  );
};

export default Header;
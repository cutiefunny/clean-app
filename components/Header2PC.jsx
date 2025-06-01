// Header.js
'use client';

import React, { useState, useEffect } from 'react'; // useEffect 추가
import CheckModal from './CheckModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Footer.module.css'; // Footer.module.css를 사용하고 계시므로 그대로 둡니다. (Header.module.css가 적절할 수 있음)

const Header2PC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // 본인인증 상태 관리
  const router = useRouter();

  // 컴포넌트 마운트 시 sessionStorage에서 본인인증 상태 확인
  useEffect(() => {
    try {
      const storedAuthDataString = sessionStorage.getItem('identityVerifiedUser');
      if (storedAuthDataString) {
        const authData = JSON.parse(storedAuthDataString);
        if (authData && authData.isVerified === true) {
          setIsVerified(true); // 세션에 저장된 인증 완료 상태를 반영
          console.log('세션에서 본인인증 상태를 확인했습니다: 인증됨');
        } else {
          setIsVerified(false); // 명시적으로 false로 설정
        }
      } else {
        setIsVerified(false); // 저장된 정보가 없으면 비인증 상태
      }
    } catch (e) {
      console.error("세션 스토리지 읽기 오류 (본인인증 상태):", e);
      setIsVerified(false); // 오류 발생 시 안전하게 비인증 상태로
    }
  }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 1회만 실행

  // "내 신청내역" 아이콘 클릭 핸들러
  const handleMyRequestsNavigation = () => {
    if (isVerified) {
      // 이미 본인인증된 경우 바로 /requests 페이지로 이동
      console.log('/requests 페이지로 바로 이동합니다 (이미 인증됨).');
      router.push('/requests');
    } else {
      // 본인인증이 안 된 경우 모달 열기
      console.log('본인인증 모달을 엽니다.');
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // CheckModal에서 본인인증 성공 시 호출될 콜백 함수
  const handleVerificationSuccess = () => {
    console.log('모달을 통해 본인인증 성공! isVerified를 true로 설정하고 /requests 페이지로 이동합니다.');
    setIsVerified(true);   // 상태를 true로 업데이트
    setIsModalOpen(false); // 모달을 닫고
    router.push('/requests'); // '/requests' 페이지로 이동
  };

  // 이 함수는 현재 JSX에서 사용되지 않지만, 이전 코드에 있었으므로 유지합니다.
  const handleWithoutVerification = () => {
    console.log('본인인증 없이 /requests 페이지로 이동합니다.');
    setIsModalOpen(false);
    router.push('/requests');
  };

  return (
    <>
      <header style={{ width: '100%', maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left Section (로고) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => router.push('/')}>
              <div style={{ flexShrink: '0' }}>
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ width: '40px', height: '40px', objectFit: 'contain', verticalAlign: 'middle' }}
                />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#4A5568' }}>
                똑똑한 선택, 빠른 견적
              </span>
            </div>

            {/* Right Section (아이콘 링크들) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/company-info" className={styles.footerLink}> {/* styles.footerLink 사용 확인 */}
                <img src="/images/pc-header1.png" alt="회사소개" style={{ verticalAlign: 'middle', width: '40px', cursor: 'pointer' }} />
              </Link>
              <Link href="/support" className={styles.footerLink} style={{ marginLeft: '15px' }}>
                <img src="/images/pc-header2.png" alt="고객지원" style={{ verticalAlign: 'middle', width: '40px', cursor: 'pointer' }} />
              </Link>
              {/* "내 신청내역" 아이콘 - 클릭 시 handleMyRequestsNavigation 호출 */}
              <div onClick={handleMyRequestsNavigation} style={{ cursor: 'pointer', marginLeft: '15px', display: 'flex', alignItems: 'center' }}>
                <img src="/images/pc-header3.png" alt="내 신청내역" style={{ verticalAlign: 'middle', width: '40px' }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CheckModal은 isModalOpen이 true이고, 아직 isVerified가 false일 때만 렌더링 */}
      {isModalOpen && !isVerified && (
        <CheckModal
          isOpen={isModalOpen} // 항상 true (위 조건에서 이미 isModalOpen이 true임)
          onClose={handleCloseModal}
          onVerified={handleVerificationSuccess} // 본인인증 성공 시 호출될 콜백 함수
        />
      )}
    </>
  );
};

export default Header2PC;
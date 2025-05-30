// components/Footer.js
'use client'; // Link 컴포넌트 사용 시에는 필수는 아니지만, router 사용 등을 고려해 추가 가능

import React from 'react';
import styles from './Footer.module.css';
import Link from 'next/link'; // next/link 임포트
// import { useRouter } from 'next/navigation'; // useRouter 사용 시

const Footer = () => {
  // const router = useRouter(); // useRouter 사용 시

  // const navigateToCompanyInfo = () => {
  //   router.push('/company-info');
  // };

  // const navigateToSupport = () => {
  //   router.push('/support'); // 고객지원 페이지 경로 예시
  // };

  return (
    <footer className={styles.footer}>
      <div style={{ paddingTop: '10px', paddingBottom: '20px', width: '100%', alignItems: 'center' }}>
        <span className={styles.callCenter}>
          고객센터 <img src="/images/phone.png" alt="Phone Icon" style={{ verticalAlign: 'middle' }} /> <span className={styles.phoneNumber}>02-123-4567</span>
        </span>
        <span className={styles.callCenter}>
          고객센터 상담시간 09:00~20:00
        </span>
      </div>
      <div className={styles.company}>
        {/* 회사소개 부분을 Link로 감싸기 */}
        <Link href="/company-info" className={styles.footerLink}>
          <img src="/images/company.png" alt="Company Icon" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          회사소개
        </Link>
        <Link href="/support" className={styles.footerLink} style={{ marginLeft: '20px' }}>
          <img src="/images/support.png" alt="Support Icon" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          고객지원
        </Link>
      </div>
      <div className={styles.address}>
        (주)픽큐 | 대표 : 홍길동 | 서울시 강남구 논현로 K빌딩 1025호
        <br />
        서울시 강남구 논현로 K빌딩 1025호 | 02-1234-5678
        <br />
        gildong@naver.com | 사업자 등록번호 1234-567890
        <br />
        개인정보관리책임자 : 홍길동 | 호스팅제공자 : 홍길동
        <br />
        통신판매업(제2025-서울강남-1234호)
        <br />
        <br />
        copyrightⓒ All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
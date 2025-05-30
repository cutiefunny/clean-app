// app/terms/page.js
'use client';

import React from 'react';
import Header2 from '@/components/Header2';
import styles from './TermsPage.module.css'; // CSS 모듈 생성 필요
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  // 실제 약관 내용은 별도의 파일이나 DB에서 가져와야 합니다.
  const termsContent = `
제1조 (목적)
본 약관은 [회사명] (이하 "회사"라 합니다)가 제공하는 [서비스명] 관련 제반 서비스의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
1. "서비스"라 함은 구현되는 단말기(PC, 모바일, 태블릿 PC 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 [서비스명] 및 [서비스명] 관련 제반 서비스를 의미합니다.
2. "회원"이라 함은 회사의 "서비스"에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 "서비스"를 이용하는 고객을 말합니다.
... (이하 생략) ...

[개인정보처리방침]
1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
... (이하 생략) ...
  `;

  return (
    <div className={styles.pageContainer}>
      <Header2 title="이용약관 및 정책" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        <h2 className={styles.sectionTitle}>서비스 이용약관</h2>
        <pre className={styles.textContent}>{termsContent.split('[개인정보처리방침]')[0]}</pre>

        <h2 className={styles.sectionTitle} style={{ marginTop: '30px' }}>개인정보처리방침</h2>
        <pre className={styles.textContent}>{termsContent.split('[개인정보처리방침]')[1] ? `[개인정보처리방침]\n${termsContent.split('[개인정보처리방침]')[1]}` : '내용 준비 중입니다.'}</pre>
      </main>
    </div>
  );
}
// app/company-info/page.js
'use client'; // useRouter를 Header2 내부 또는 여기서 사용할 가능성을 위해

import React from 'react';
import Header2 from '@/components/Header2'; // 가정: Header2 컴포넌트 경로
import styles from './CompanyInfoPage.module.css';
import { useRouter } from 'next/navigation'; // 뒤로가기 기능에 사용

const companyInfoSections = [
  {
    id: 1,
    title: '회사연혁',
    content: '연혁에 대한 상세 내용입니다. '
  },
  {
    id: 2,
    title: '지향',
    content: '회사의 지향점에 대한 상세 내용입니다. '
  },
  {
    id: 3,
    title: '언론소개',
    content: '언론 소개에 대한 상세 내용입니다. '
  },
  {
    id: 4,
    title: '서비스',
    content: '청소매칭을 전문으로 합니다. '
  },
];

export default function CompanyInfoPage() {
  const router = useRouter();

  return (
    <div className={styles.pageContainer}>
      <Header2 title="회사정보" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        {companyInfoSections.map((section) => (
          <div key={section.id} className={styles.infoCard}>
            <h2 className={styles.cardTitle}>{section.title}</h2>
            <p className={styles.cardContent}>{section.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
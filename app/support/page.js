// app/support/page.js
'use client';

import React from 'react';
import Header2 from '@/components/Header2'; // Header2 컴포넌트 경로
import styles from './SupportPage.module.css'; // 새 CSS 모듈 파일
import { useRouter } from 'next/navigation'; // 뒤로가기 기능에 사용
import Link from 'next/link'; // 1:1 문의 등 내부 링크용

const supportSections = [
  {
    id: 'faq',
    title: '자주 묻는 질문 (FAQ)',
    content: '서비스 이용 중 궁금한 점들을 모아 답변해 드립니다. 카테고리별로 자주 묻는 질문을 찾아보세요.',
    link: '/faq' // FAQ 페이지가 있다면 연결
  },
  {
    id: 'inquiry',
    title: '1:1 문의하기',
    content: 'FAQ에서 해결되지 않는 문제가 있으신가요? 1:1 문의를 통해 궁금한 점을 직접 문의해주세요. 최대한 빠르게 답변드리겠습니다.',
    link: '/inquiry/new' // 1:1 문의 작성 페이지 경로 예시
  },
  {
    id: 'notice',
    title: '공지사항',
    content: '서비스 관련 중요 업데이트, 점검 일정, 이벤트 등 새로운 소식을 알려드립니다.',
    link: '/notices' // 공지사항 목록 페이지 경로 예시
  },
  {
    id: 'terms',
    title: '이용약관 및 정책',
    content: '서비스 이용약관, 개인정보처리방침, 청소년보호정책 등 서비스 운영에 대한 주요 정책 내용을 확인하실 수 있습니다.',
    link: '/terms' // 약관 페이지 경로 예시
  },
];

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className={styles.pageContainer}>
      <Header2 title="고객지원" onBack={() => router.back()} />
      <main className={styles.contentArea}>
        {supportSections.map((section) => (
          // 각 섹션을 Link로 감싸서 클릭 가능하게 만들거나,
          // 카드 내부에 별도의 "바로가기" 버튼을 추가할 수 있습니다.
          // 여기서는 카드를 Link로 감싸는 예시입니다.
          <Link key={section.id} href={section.link || '#'} className={styles.cardLink}>
            <div className={styles.infoCard}>
              <h2 className={styles.cardTitle}>{section.title}</h2>
              <p className={styles.cardContent}>{section.content}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}